// StoryApp.swift — entry point
// Sets up the audio session so playback continues in silent mode and (optionally) when the phone is locked.

import SwiftUI
import AVFoundation

@main
struct StoryApp: App {
    init() {
        // .playback = full audio session, ignores the mute switch and may run in background.
        // If you don't want background audio, change to .ambient and skip the UIBackgroundModes entry.
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden) // hides the home-indicator bar (iOS 16+)
                .ignoresSafeArea()
        }
    }
}
