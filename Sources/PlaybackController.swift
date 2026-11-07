import AVFoundation
import MediaPlayer
import WidgetKit
import UIKit

/// One player per app. Web layout changes and system playback controls operate on the same session.
final class PlaybackController: NSObject {
    static let shared = PlaybackController()

    let catalogData: Data
    private let recordings: [Recording]
    private var recording: Recording?
    private var player: AVAudioPlayer?
    private var minutes = UserDefaults.standard.integer(forKey: "sleepMinutes")
    private var chinese = StoryLanguage.isChinese
    private var deadline: Date?
    private var stopTimer: Timer?
    private var fadeTimer: Timer?
    private let fadeWindow: TimeInterval = 10
    // A paused timer is listening time, not a wall-clock deadline.
    private var pausedSeconds: TimeInterval? = UserDefaults.standard.object(forKey: "pausedSleepSeconds") as? Double {
        didSet { UserDefaults.standard.set(pausedSeconds, forKey: "pausedSleepSeconds") }
    }
    private var listeningVolume: Float {
        0.85 * Float(pow(10, min(0, recording?.trimDB ?? 0) / 20))
    }
    private var failed = false
    private var sessionActive = false
    private var pendingLink: Recording?
    private var artworkID: String?
    private var artwork: MPMediaItemArtwork?
    private func cover(for id: String) -> MPMediaItemArtwork? {
        if artworkID == id { return artwork }
        guard let url = Bundle.main.url(forResource: id, withExtension: "jpg",
                                         subdirectory: Recording.contentDirectory + "/Covers"),
              let image = UIImage(contentsOfFile: url.path) else { return nil }
        artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        artworkID = id
        return artwork
    }
    private var ready = false
    var stateDidChange: (([String: Any]) -> Void)?

    override init() {
        catalogData = (try? Recording.catalogData(in: .main, subdirectory: Recording.contentDirectory)) ?? Data()
        recordings = (try? JSONDecoder().decode([Recording].self, from: catalogData)) ?? []
        super.init()
        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(interrupted(_:)), name: AVAudioSession.interruptionNotification, object: nil)
        center.addObserver(self, selector: #selector(routeChanged(_:)), name: AVAudioSession.routeChangeNotification, object: nil)
        center.addObserver(self, selector: #selector(checkDeadline), name: UIApplication.didBecomeActiveNotification, object: nil)
        let commands = MPRemoteCommandCenter.shared()
        commands.playCommand.addTarget(self, action: #selector(remotePlay(_:)))
        commands.pauseCommand.addTarget(self, action: #selector(remotePause(_:)))
        commands.togglePlayPauseCommand.addTarget(self, action: #selector(remoteToggle(_:)))
    }

    deinit {
        stopTimer?.invalidate()
        fadeTimer?.invalidate()
        NotificationCenter.default.removeObserver(self)
        let commands = MPRemoteCommandCenter.shared()
        [commands.playCommand, commands.pauseCommand, commands.togglePlayPauseCommand].forEach { $0.removeTarget(self) }
    }

    func open(_ url: URL) {
        guard url.scheme == "story", url.host == "recording",
              let linked = recordings.first(where: { $0.id == String(url.path.dropFirst()) }) else { return }
        if ready { select(linked, play: true) } else { pendingLink = linked }
    }

    func playFromWidget(_ id: String) throws {
        guard let item = recordings.first(where: { $0.id == id }) else { throw CocoaError(.fileNoSuchFile) }
        select(item, play: true)
        if failed { throw CocoaError(.fileReadUnknown) }
    }

    func handle(_ message: [String: Any]) {
        guard let action = message["action"] as? String, let id = message["id"] as? String,
              let item = recordings.first(where: { $0.id == id }) else { return }
        switch action {
        case "ready", "settings":
            chinese = message["lang"] as? String == "zh"
            if chinese != StoryLanguage.isChinese {
                StoryLanguage.defaults?.set(chinese ? "zh" : "en", forKey: "captionLanguage")
                WidgetCenter.shared.reloadTimelines(ofKind: "StoryDailyRecording")
            }
            let value = message["minutes"] as? Int ?? 0
            if [0, 25, 45, 60].contains(value), minutes != value {
                minutes = value
                UserDefaults.standard.set(value, forKey: "sleepMinutes")
                pausedSeconds = nil
                if player?.isPlaying == true {
                    scheduleStop(seconds: Double(minutes * 60))
                    player?.setVolume(listeningVolume, fadeDuration: 0.25)
                }
            }
            if recording == nil { recording = item }
            ready = true
            if let linked = pendingLink {
                pendingLink = nil
                select(linked, play: true)
            } else { checkDeadline() }
        case "select": select(item, play: player?.isPlaying == true)
        case "toggle":
            if player?.isPlaying == true { pause() } else { start() }
        default: break
        }
    }

    private func select(_ item: Recording, play: Bool) {
        if play {
            if recording?.id != item.id || player?.isPlaying != true {
                start(item)
            } else if failed {
                failed = false
                publish()
            }
        } else if recording?.id != item.id {
            player?.stop()
            player = nil
            recording = item
            failed = false
            publish()
        }
    }

    private func start(_ requested: Recording? = nil) {
        guard let item = requested ?? recording else { return }
        let continuing = player?.isPlaying == true
        let session = AVAudioSession.sharedInstance()
        do {
            if !sessionActive {
                try session.setCategory(.playback)
                try session.setActive(true)
                sessionActive = true
            }

            let next: AVAudioPlayer
            if item.id == recording?.id, let existing = player {
                next = existing
            } else {
                guard let url = Bundle.main.url(forResource: item.file, withExtension: nil,
                                                subdirectory: Recording.contentDirectory) else {
                    throw CocoaError(.fileNoSuchFile)
                }
                next = try AVAudioPlayer(contentsOf: url)
                next.numberOfLoops = -1
                next.delegate = self
            }

            // Keep the old audio session and deadline alive until the replacement
            // actually starts, including when an intent changes tracks in StandBy.
            next.volume = 0
            guard next.prepareToPlay(), next.play() else { throw CocoaError(.fileReadUnknown) }
            if player !== next { player?.stop() }
            player = next
            recording = item
            failed = false
            if !continuing {
                scheduleStop(seconds: pausedSeconds ?? Double(minutes * 60))
                pausedSeconds = nil
            }
            if let left = deadline?.timeIntervalSinceNow, left <= fadeWindow {
                if left <= 0 { finishTimer(); return }
                fadeOut(seconds: left, entering: true)
            } else {
                next.setVolume(listeningVolume, fadeDuration: 1.2)
            }
            publish()
        } catch {
            failed = true
            if continuing { publish() } else { pause() }
        }
    }

    func pause() {
        if let left = deadline?.timeIntervalSinceNow { pausedSeconds = left > 0 ? left : nil }
        stopPlayback()
    }

    private func finishTimer() {
        pausedSeconds = nil
        stopPlayback()
    }

    private func stopPlayback() {
        player?.pause()
        clearSchedule()
        if sessionActive {
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            sessionActive = false
        }
        publish()
    }

    private func clearSchedule() {
        stopTimer?.invalidate()
        fadeTimer?.invalidate()
        stopTimer = nil
        fadeTimer = nil
        deadline = nil
    }

    private func scheduleStop(seconds: TimeInterval) {
        clearSchedule()
        guard minutes > 0 else { return }
        let end = Date().addingTimeInterval(seconds)
        deadline = end
        if seconds > fadeWindow {
            let fade = Timer(fire: end.addingTimeInterval(-fadeWindow), interval: 0, repeats: false) { [weak self] _ in
                guard let self, let left = self.deadline?.timeIntervalSinceNow else { return }
                if left > 0 { self.fadeOut(seconds: left, entering: false) }
                else { self.finishTimer() }
            }
            RunLoop.main.add(fade, forMode: .common)
            fadeTimer = fade
        }
        let timer = Timer(fire: end, interval: 0, repeats: false) { [weak self] _ in self?.finishTimer() }
        RunLoop.main.add(timer, forMode: .common)
        stopTimer = timer
    }

    private func fadeOut(seconds: TimeInterval, entering: Bool) {
        // Never jump back to full level after resuming or switching tracks inside the fade.
        if entering { player?.volume = listeningVolume * Float(min(1, seconds / fadeWindow)) }
        player?.setVolume(0, fadeDuration: seconds)
    }

    @objc private func checkDeadline() {
        // Compare timestamps directly: some iOS builds lack Foundation's Date.<= symbol.
        if let deadline, deadline.timeIntervalSince1970 <= Date().timeIntervalSince1970 {
            finishTimer()
        } else {
            publish()
        }
    }

    private func publish() {
        guard let item = recording else { return }
        let playing = player?.isPlaying == true
        if player != nil {
            let caption = item.caption(chinese: chinese)
            var info: [String: Any] = [
                MPMediaItemPropertyTitle: caption.name,
                MPMediaItemPropertyArtist: caption.location,
                MPMediaItemPropertyAlbumTitle: "Story",
                MPNowPlayingInfoPropertyPlaybackRate: playing ? 1.0 : 0.0
            ]
            info[MPMediaItemPropertyArtwork] = cover(for: item.id)
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        } else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        }
        stateDidChange?(["id": item.id, "playing": playing, "deadline": (deadline?.timeIntervalSince1970 ?? 0) * 1000, "pausedMS": (pausedSeconds ?? 0) * 1000, "failed": failed])
    }

    @objc private func remotePlay(_ event: MPRemoteCommandEvent) -> MPRemoteCommandHandlerStatus {
        onMain {
            guard self.recording != nil else { return .noSuchContent }
            if self.player?.isPlaying != true { self.start() }
            return self.failed ? .commandFailed : .success
        }
    }
    @objc private func remotePause(_ event: MPRemoteCommandEvent) -> MPRemoteCommandHandlerStatus {
        onMain { self.pause(); return .success }
    }
    @objc private func remoteToggle(_ event: MPRemoteCommandEvent) -> MPRemoteCommandHandlerStatus {
        onMain { self.player?.isPlaying == true ? self.remotePause(event) : self.remotePlay(event) }
    }

    private func onMain<T>(_ work: () -> T) -> T {
        Thread.isMainThread ? work() : DispatchQueue.main.sync(execute: work)
    }

    @objc private func interrupted(_ note: Notification) {
        guard let type = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              type == AVAudioSession.InterruptionType.began.rawValue else { return }
        DispatchQueue.main.async { self.pause() }
    }
    @objc private func routeChanged(_ note: Notification) {
        guard let reason = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              reason == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue else { return }
        DispatchQueue.main.async { self.pause() }
    }
}

extension PlaybackController: AVAudioPlayerDelegate {
    func audioPlayerDecodeErrorDidOccur(_ source: AVAudioPlayer, error: Error?) {
        DispatchQueue.main.async {
            guard source === self.player else { return }
            self.failed = true
            self.player = nil
            self.pause()
        }
    }
}
