# Story — iOS

Native iOS shell for the Story white-noise app. The actual UI is the existing
web build (see [storybyclaude](https://github.com/Mlikeason/storybyclaude)) loaded
inside a full-screen `WKWebView`. This is the fastest path from "web app done"
to "installed on iPhone".

## Trade-offs (read first)

The good:
- Zero UI rework. Edit `Resources/index.html` once → both the web version and
  the iOS version update.
- Audio plays in silent mode and (with `UIBackgroundModes = audio`) keeps
  playing when the phone locks.

The not-so-good:
- No Lock Screen / Control Center "Now Playing" card with title + artwork.
  That requires a true native rewrite using `MPNowPlayingInfoCenter`.
- App Store review can be sticky about pure web-view apps ("4.2 Minimum
  Functionality"). For personal install or TestFlight this isn't a problem.
- The bundled `02rain0404.mp3` is 96 MB. The whole app will be ~135 MB.
  Re-encode at lower bitrate before App Store, or stream from a server.

If those are dealbreakers, skip this and rewrite the player in SwiftUI +
`AVAudioPlayer`. See "Native rewrite later" at the bottom of this README.

## Repo layout

```
story-ios/
├── README.md              ← you are here
├── Resources/             ← drag this into Xcode as a folder reference
│   ├── index.html
│   ├── privacy.html
│   ├── icon.png
│   └── *.mp3
├── Sources/
│   ├── StoryApp.swift     ← @main, audio session setup
│   └── ContentView.swift  ← WKWebView host
└── Info.plist.snippet     ← keys you need to add
```

## Xcode setup (one-time, ~10 minutes)

### 1. Create the project

1. Open Xcode → **File → New → Project…**
2. **iOS → App**
3. Fill in:
   - **Product Name**: `Story`
   - **Team**: pick your Apple ID (Personal Team is fine for sideloading)
   - **Organization Identifier**: `com.mlikeason` (anything reverse-DNS)
   - **Interface**: SwiftUI
   - **Language**: Swift
   - **Storage**: None
   - **Include Tests**: off
4. **Save it inside this directory** (`~/story-ios/`). When Xcode asks
   "Create Git repository on my Mac" — uncheck it (this folder is already a
   git repo).

After this you should have `~/story-ios/Story.xcodeproj` and a `Story/` group
that Xcode auto-generated.

### 2. Replace the auto-generated Swift files

Xcode creates `StoryApp.swift` and `ContentView.swift` automatically inside the
`Story/` group. Replace their contents with the files in this repo's
`Sources/` folder:

```bash
cp Sources/StoryApp.swift     Story/StoryApp.swift
cp Sources/ContentView.swift  Story/ContentView.swift
```

(or just open both in Xcode and paste.)

### 3. Add Resources as a folder reference

This is the step people most often get wrong. The audio + html files have to
sit on disk inside the app bundle, accessed via `Bundle.main.url(...)`.

1. In Xcode's left sidebar, right-click the `Story` group → **Add Files to "Story"…**
2. Select the `Resources` folder (the whole folder, not its contents).
3. **Important options**:
   - **Copy items if needed**: OFF (they're already next to the project)
   - **Create folder references**: **ON** ← the folder should turn **blue**
     in Xcode, not yellow. Yellow = "group", which flattens the files and
     breaks the `subdirectory: "Resources"` lookup.
   - **Add to targets**: tick **Story**

### 4. Set the Info.plist keys

Open the **Story** target → **Info** tab. Add the keys from
`Info.plist.snippet` (either by clicking the **+** in the Info tab or by
editing `Info.plist` directly as source).

The four keys you need:
- `UIStatusBarHidden = YES`
- `UIViewControllerBasedStatusBarAppearance = NO`
- `UIRequiresFullScreen = YES`
- `UIBackgroundModes = [audio]` (only if you want lock-screen playback)

### 5. App icon

1. Open `Assets.xcassets` → `AppIcon`.
2. Drag `Resources/icon.png` (1024×1024) onto the "All Sizes" slot.
3. Xcode 14+ will derive every smaller size automatically.

### 6. Run it on your iPhone

1. Plug in your iPhone with a cable. Trust the Mac when prompted.
2. In Xcode's top bar, pick your iPhone from the device dropdown.
3. Press **▶ Run** (Cmd-R).
4. First time on a personal Apple ID: after the app installs but refuses to
   launch, go to **Settings → General → VPN & Device Management** on the
   phone, tap your Apple ID, **Trust**, then launch from the home screen.

Personal Team signing lasts 7 days. Re-plug + re-run to refresh.

## After it's running

Edits to the web app:
```bash
# Pull a fresh index.html from the web repo
cp ../StorybyClaude/index.html Resources/index.html
# Rebuild in Xcode (Cmd-R)
```

Edits to native shell: edit the Swift files; no resource re-copy needed.

## Native rewrite later (Option B)

If you outgrow the web shell, the rewrite scope is:
- Pages → `TabView` with `.tabViewStyle(.page(indexDisplayMode: .never))`,
  or a custom horizontal `ScrollView` with snap.
- Backgrounds → SwiftUI `Canvas` or `Shape` per scene (the SVGs are simple
  enough to port). Or just bundle them as PNG/JPG and use `Image`.
- Audio → `AVAudioPlayer` + `MPNowPlayingInfoCenter` for lock-screen art &
  title + `MPRemoteCommandCenter` for play/pause from Control Center.
- Favorites/language → `@AppStorage` (UserDefaults under the hood).
- Typography → register `NotoSerifSC` & `SpaceMono` font files in the bundle
  + `UIAppFonts` Info.plist entry.

I can scaffold that when you're ready — say the word.
