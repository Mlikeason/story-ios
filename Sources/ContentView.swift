// ContentView.swift — root view
// Hosts a full-screen WKWebView that loads the bundled index.html.

import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        StoryWebView()
            .ignoresSafeArea()
            .background(Color.black)
    }
}

struct StoryWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []   // let the page autoplay audio after the first tap
        config.suppressesIncrementalRendering = false

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // Resources folder is added to the bundle as a folder reference (blue folder in Xcode),
        // so its files are accessible under the "Resources" subdirectory.
        guard let url = Bundle.main.url(
            forResource: "index",
            withExtension: "html",
            subdirectory: "Resources"
        ) else {
            return
        }
        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }
}

#Preview {
    ContentView()
}
