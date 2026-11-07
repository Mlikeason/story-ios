import SwiftUI
import WebKit
import MessageUI

struct ContentView: View {
    let playback: PlaybackController
    @Environment(\.layoutDirection) private var direction
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.verticalSizeClass) private var verticalSizeClass
    private enum HingePosition { case closed, partial, other, unavailable }
    @State private var hingePosition = HingePosition.unavailable

    var body: some View {
        if #available(iOS 27.1, *) {
            player.onHingeChange { _, context in
                switch context.hinge?.status {
                case .closed: hingePosition = .closed
                case .partiallyOpen: hingePosition = .partial
                case nil: hingePosition = .unavailable
                default: hingePosition = .other
                }
            }
        } else {
            player
        }
    }

    private var player: some View {
        GeometryReader { geometry in
            let safe = geometry.safeAreaInsets
            let insets = UIEdgeInsets(
                top: safe.top, left: direction == .leftToRight ? safe.leading : safe.trailing,
                bottom: safe.bottom, right: direction == .leftToRight ? safe.trailing : safe.leading
            )
            GeometryReader { surface in
                let compactCover = horizontalSizeClass == .compact &&
                    (hingePosition == .closed || (hingePosition == .partial && verticalSizeClass == .compact))
                let standardPhone = UIDevice.current.userInterfaceIdiom == .phone && hingePosition == .unavailable
                StoryWebView(playback: playback, layout: PlayerLayout(insets: insets, surface: surface, compactCover: compactCover, standardPhone: standardPhone))
            }
            .ignoresSafeArea()
        }
        .background(Color.black)
    }
}

// All coordinates are in the full-bleed web view's local space.
private struct PlayerLayout: Equatable {
    let insets: UIEdgeInsets
    let standardPhone: Bool
    var fold: CGRect?
    enum Cover: String { case none, portrait, tent }
    var cover = Cover.none
    var rail: [String: CGFloat] = [:]

    init(insets: UIEdgeInsets, surface: GeometryProxy, compactCover: Bool, standardPhone: Bool) {
        self.insets = insets
        self.standardPhone = standardPhone
        guard #available(iOS 27.1, *) else { return }
        let bounds = CGRect(origin: .zero, size: surface.size)
        let divisions = surface.reservedRegions(kind: .division).map { $0.frame.intersection(bounds) }.filter { !$0.isEmpty }
        fold = divisions.first { $0.width > $0.height && $0.minY > 0 && $0.maxY < bounds.maxY }
        if compactCover && divisions.isEmpty && !bounds.isEmpty {
            cover = bounds.width > bounds.height ? .tent : .portrait
        }

        // A landscape iPhone can report the camera-side inset as a full-height
        // occlusion. There is no system status column below which to place controls.
        if standardPhone && bounds.width > bounds.height { return }

        // A corner occlusion includes the system indicators and their margins.
        // A wide status strip or a centered camera doesn't define a side column.
        let corners = surface.reservedRegions(kind: .occlusion).map { $0.frame.intersection(bounds) }
            .filter { !$0.isEmpty && $0.minY <= 1 && $0.width < bounds.width / 2 &&
                ($0.minX <= 1 || $0.maxX >= bounds.maxX - 1) }
        if let corner = corners.max(by: { $0.maxY < $1.maxY }) {
            let edge = corner.midX < bounds.midX ? "left" : "right"
            rail[edge] = 26 // Center of the system ring, 48 pt from the edge, minus half the hit target.
            rail["top"] = max(insets.top, corner.maxY) + 2
        }
    }
}

private struct StoryWebView: UIViewRepresentable {
    let playback: PlaybackController
    let layout: PlayerLayout

    func makeCoordinator() -> Coordinator { Coordinator(playback) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let scripts = config.userContentController
        scripts.add(context.coordinator, name: "story")
        let catalog = String(data: playback.catalogData, encoding: .utf8) ?? "[]"
        scripts.addUserScript(WKUserScript(source: "window.storyRecordings = " + catalog,
                                           injectionTime: .atDocumentStart, forMainFrameOnly: true))
        var hardware = utsname()
        uname(&hardware)
        let model = withUnsafeBytes(of: &hardware.machine) { String(decoding: $0.prefix { $0 != 0 }, as: UTF8.self) }
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""
        let supportInfo = ["app": version + " (" + build + ")", "device": model,
                           "system": UIDevice.current.systemName + " " + UIDevice.current.systemVersion]
        if let data = try? JSONSerialization.data(withJSONObject: supportInfo), let json = String(data: data, encoding: .utf8) {
            scripts.addUserScript(WKUserScript(source: "window.storySupportInfo = " + json,
                                               injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        let view = WKWebView(frame: .zero, configuration: config)
        view.isOpaque = false
        view.backgroundColor = .black
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.scrollView.bounces = false
        view.navigationDelegate = context.coordinator
        context.coordinator.view = view
        playback.stateDidChange = { [weak view] state in
            view?.callAsyncJavaScript("window.storyPlaybackChanged?.(state)", arguments: ["state": state], in: nil, in: .page, completionHandler: nil)
        }
        context.coordinator.loadPlayer()
        return view
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.layout != layout {
            context.coordinator.layout = layout
            context.coordinator.updateInsets()
        }
    }

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate, MFMailComposeViewControllerDelegate {
        let playback: PlaybackController
        weak var view: WKWebView?
        var layout: PlayerLayout?
        let page = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: Recording.contentDirectory)

        init(_ playback: PlaybackController) { self.playback = playback }

        func loadPlayer() {
            guard let page else { return }
            view?.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        }

        func updateInsets() {
            guard let view, let layout else { return }
            let insets = layout.insets
            let values = ["top": insets.top, "right": insets.right, "bottom": insets.bottom, "left": insets.left]
            let hinge = layout.fold.map { ["start": $0.minY, "end": $0.maxY] } ?? [:]
            view.callAsyncJavaScript("""
                const root = document.documentElement;
                for (const [side, pt] of Object.entries(values)) {
                  root.style.setProperty('--' + side, 'max(' + pt + 'px, env(safe-area-inset-' + side + ', 0px))')
                }
                root.dataset.rail = 'left' in rail ? 'left' : 'right';
                for (const key of ['left', 'right', 'top']) {
                  if (key in rail) root.style.setProperty('--rail-' + key, rail[key] + 'px');
                  else root.style.removeProperty('--rail-' + key);
                }
                root.toggleAttribute('data-tabletop', 'start' in hinge);
                root.toggleAttribute('data-standard-phone', standardPhone);
                if (cover === 'none') root.removeAttribute('data-cover');
                else root.dataset.cover = cover;
                if ('start' in hinge) {
                  root.style.setProperty('--fold-start', hinge.start + 'px');
                  root.style.setProperty('--fold-end', hinge.end + 'px');
                }
                window.storyLayoutChanged?.();
                """, arguments: ["values": values, "rail": layout.rail, "hinge": hinge, "cover": layout.cover.rawValue, "standardPhone": layout.standardPhone], in: nil, in: .page, completionHandler: nil)
        }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { updateInsets() }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { loadPlayer() }

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.standardizedFileURL == page?.standardizedFileURL,
                  let body = message.body as? [String: Any] else { return }
            if body["action"] as? String == "supportMail" {
                guard let subject = body["subject"] as? String, subject.count <= 200,
                      let text = body["body"] as? String, text.count <= 8000 else { return }
                composeMail(subject: subject, body: text)
                return
            }
            if body["action"] as? String == "supportCopy" {
                guard let text = body["text"] as? String, text.count <= 8500 else { return }
                UIPasteboard.general.string = text
                supportResult(body["success"] as? String == "copiedEmail" ? "copiedEmail" : "copiedMessage")
                return
            }
            playback.handle(body)
        }

        private func supportResult(_ status: String) {
            view?.callAsyncJavaScript("window.storySupportResult?.(status)", arguments: ["status": status],
                                     in: nil, in: .page, completionHandler: nil)
        }

        private func composeMail(subject: String, body: String) {
            if MFMailComposeViewController.canSendMail(), var presenter = view?.window?.rootViewController {
                while let presented = presenter.presentedViewController { presenter = presented }
                guard !(presenter is MFMailComposeViewController) else { return }
                let composer = MFMailComposeViewController()
                composer.mailComposeDelegate = self
                composer.setToRecipients(["zivzhu@gmail.com"])
                composer.setSubject(subject)
                composer.setMessageBody(body, isHTML: false)
                presenter.present(composer, animated: true)
            } else {
                var components = URLComponents()
                components.scheme = "mailto"
                components.path = "zivzhu@gmail.com"
                components.queryItems = [URLQueryItem(name: "subject", value: subject), URLQueryItem(name: "body", value: body)]
                guard let url = components.url else { supportResult("unavailable"); return }
                UIApplication.shared.open(url, options: [:]) { [weak self] opened in
                    self?.supportResult(opened ? "draft" : "unavailable")
                }
            }
        }

        func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
            let status: String
            if error != nil { status = "failed" }
            else {
                switch result {
                case .sent: status = "sent"
                case .saved: status = "saved"
                case .cancelled: status = "cancelled"
                default: status = "failed"
                }
            }
            controller.dismiss(animated: true) { [weak self] in self?.supportResult(status) }
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            let url = action.request.url
            if url?.scheme == "mailto", action.navigationType == .linkActivated, let url {
                UIApplication.shared.open(url)
            }
            if let url, ["http", "https"].contains(url.scheme?.lowercased() ?? ""),
               url.host?.lowercased() == "zhuhong.me", action.navigationType == .linkActivated {
                UIApplication.shared.open(url)
            }
            let directory = page?.deletingLastPathComponent()
            let allowed = action.targetFrame?.isMainFrame == true ? [page] :
                [directory?.appendingPathComponent("privacy.html"), directory?.appendingPathComponent("support.html"),
                 directory?.appendingPathComponent("about.html")]
            let matchesFile = url?.isFileURL == true && allowed.contains { $0?.standardizedFileURL.path == url?.standardizedFileURL.path }
            decisionHandler(matchesFile || url?.absoluteString == "about:blank" ? .allow : .cancel)
        }
    }
}
