# Story · 实地录音

一本可以听的私人旅行手记。六段离线实地录音，各有地点、年份和动态风景。左右滑动或点箭头切换录音，可以收藏、切换中英文，或设置持续循环、25 分钟、45 分钟和 60 分钟的睡眠定时。

## 在 iPhone 运行

1. 用 Xcode 27.1 或更新版打开 `Story.xcodeproj`，选择 **Story** scheme。工程最低支持 iOS 16，Duo 边到边全屏需要用 **iOS 27.1 SDK 或更新版**构建。
2. 模拟器可直接运行。装到真机时，先在手机上开启开发者模式，再在 Story 和 StoryWidget 两个 target 中选择同一个 Signing Team。两份开发描述文件都必须包含测试机，并允许工程设置 `STORY_APP_GROUP` 指定的共享组（默认 `group.com.mlikeason.Story`）。当前示例 Bundle ID 为 `com.mlikeason.Story`，扩展使用其 `.Widget` 后缀。覆盖既有安装时，请沿用原 App 的 Bundle ID 和签名身份。
3. 在 Device Hub 选择 iPhone Duo，运行后切换折叠、旋转、展开及左右分屏。主应用与扩展均使用工程内的文件，无需再手动导入音频。

## 外屏和内屏

- **折叠竖向外屏**：侧边的双段按钮可切换播放器和 Playlist。
- **折叠横向外屏**：Story 旁显示英文标语，底部居中显示波形和播放控件，侧边保留定时。进入此姿态时会收起播放列表。
- **外屏锁屏待机**：在系统设置启用待机显示并允许帐篷姿态，在待机界面添加 Story 小组件。它每天轮换一段录音。播放按钮开始当天录音，暂停按钮控制当前 Story 播放；这两个按钮在 iOS 17 及以上通过音频 App Intent 执行。点标题可打开对应录音。待机界面和锁定时的交互由系统管理。
- **展开全屏**：默认显示全屏播放器；可用布局按钮切换为播放器和 Playlist，并记住选择。铺平时，横屏左右排列，竖屏上下排列；横向折痕激活时，两块内容分别放在折痕上下。折回窄窗口后，声音库收进按钮。调整尺寸时保留同一播放会话、剩余定时、语言和收藏。
- **普通 iPhone**：波形和播放键沿屏幕中线排列，右侧定时与设置之间的圆形图标打开播放列表。应用默认英文，在齿轮设置中可改为简体中文。

[Apple 的 Duo 适配讲解](https://developer.apple.com/videos/play/tech-talks/111461/) · [Duo 设计指南](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo) · [待机小组件](https://developer.apple.com/documentation/widgetkit/adding-standby-and-carplay-support-to-your-widget) · [交互式小组件与音频意图](https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities)

## 实现

- `Resources/recordings.json` 保存双语文案、稳定 ID、文件名和从录音提取的波形。页面直接加载本地 HTML、CSS、JavaScript 和 SVG。收藏、语言、录音和定时选项沿用旧的 `whitenoise_v3` 存储键。
- `Sources/ContentView.swift` 在创建 WKWebView 时载入页面。窗口重排只更新安全区。iOS 使用 `PlaybackController` 的单个 AVAudioPlayer，并接入系统“正在播放”和播放／暂停指令。锁屏定时由原生播放器管理。暂停会保留剩余时长，继续播放时接着倒数；最后 10 秒由原生播放器淡出。锁屏封面使用当前场景的方形静态图。
- `Widget/` 与主应用共享录音目录和音频意图。扩展只打包小型 JSON 目录，音频由主应用播放。小组件通过 App Group 读取 App 里选择的语言，默认英文。
- 设置和播放列表底部提供 Write to Story、报告问题、使用帮助、关于 Story 和隐私入口。`Resources/support.html`、`support.css`、`support.js` 是 App 内离线帮助和网站共用的来源；`about.html` 是中英文作者介绍，并可在系统浏览器中打开个人网站。
- 反馈先生成可编辑的邮件草稿，用户确认后由邮件 App 发送。问题反馈可选择附带当前录音、定时、播放状态、版本与设备型号，不包含唯一设备标识或收听历史。没有邮件账户时可复制邮箱和内容。反馈文字仅保留在当前页面内存中。
- 公开支持页使用 `https://zhuhong.me/story/`，介绍与隐私页分别为同目录的 `about.html` 和 `privacy.html`。页面已同步到 Web V2 的 `/Users/hoo/zhuhong-journal/story/`，2026-11-08 已验证正式网址可免登录访问。后续运行 `python3 Tools/package-support-website.py` 更新材料包，再将 `AppStore/website/` 中五个文件复制到 Web V2 的 `story/` 并部署。App 内的「在网站上查看」指向这些网址，并保留离线副本。

## 验证

浏览器预览可在仓库根目录运行 `python3 -m http.server 8000 --bind 127.0.0.1 --directory Resources` 后打开本机 8000 端口。浏览器使用 HTML Audio，适合检查布局和交互。安装开发依赖 Playwright 及 Google Chrome 后，可运行 `node --test Tests/player.cjs Tests/support.cjs`，覆盖播放时折叠／展开、七种窗口尺寸、最小触控区域、偏好持久化、定时到期、中英文反馈、附带信息选择、复制路径和反馈期间的播放连续性。

2026-11-03 在 Xcode 27.2（27B52）、iPhone Duo 专用 iOS 27.2（24B91016s）模拟器实测：

- 播放中从 678 × 466 pt 外屏展开到 669 × 951 pt 内屏。采样间隔为 0.250 秒，AVAudioPlayer 的播放位置也前进 0.250 秒。切换前后是同一播放器、同一录音和同一睡眠截止时间。
- 外屏主屏幕上的 Story 小组件可切换到当天录音并保留已有定时。暂停后位置保持在 13.118 秒，再播放时从该位置继续。
- 系统可以进入半开内屏的 StandBy。部分请求超时，成功进入后两侧叠放的添加面板均未显示可选组件。锁屏帐篷外屏内的 Story 小组件点击仍需真机验收。

在 Xcode 27.1+ 和 Duo 真机上验收时，重点检查：

1. 播放一段录音并设定 25 分钟，外屏横向 → 展开 → 左、右窄分屏 → 合上。确认没有叠音或重播，剩余时间连续，控件避开系统栏。
2. 锁屏摆成帐篷，从 Story 小组件播放当天录音、暂停，再回到 App 核对音轨与状态。测试锁屏期间定时停止、系统媒体控制和拔出耳机。
3. 分别在两种语言、大字号和 VoiceOver 下打开声音库，选择最长的标题，进入隐私声明并返回。
