import AppIntents

// AudioPlaybackIntent runs in the host app, including when a button is tapped
// in StandBy. Only the host target links the player and owns the audio session.
@available(iOS 17.0, macOS 14.0, *)
struct PlayFieldRecording: AudioPlaybackIntent {
    static var title: LocalizedStringResource = "Play field recording"
    @Parameter(title: "Recording") var recordingID: String

    init() {}
    init(_ id: String) { recordingID = id }

    @MainActor func perform() async throws -> some IntentResult {
        #if !STORY_WIDGET
        try PlaybackController.shared.playFromWidget(recordingID)
        #endif
        return .result()
    }
}

@available(iOS 17.0, macOS 14.0, *)
struct PauseFieldRecording: AudioPlaybackIntent {
    static var title: LocalizedStringResource = "Pause Story"

    @MainActor func perform() async throws -> some IntentResult {
        #if !STORY_WIDGET
        PlaybackController.shared.pause()
        #endif
        return .result()
    }
}
