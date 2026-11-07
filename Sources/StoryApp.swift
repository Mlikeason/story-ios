import SwiftUI

@main
struct StoryApp: App {
    private let playback = PlaybackController.shared

    var body: some Scene {
        WindowGroup {
            ContentView(playback: playback)
                .preferredColorScheme(.dark)
                .onOpenURL { playback.open($0) }
        }
    }
}
