# Story 海外首发材料

更新日期：2026-11-08。已按发行人最新要求更新中文名称「声音 Story: 今生不再」，重写中英文十二张截图、商店介绍及推广文本，说明这是历年录音选集的第一部分，之后会持续加入新录音。原正式版本 1.1（构建 6）已重新递交 App Review，Apple 已确认「已提交 1 个项目」和「正在等待审核」。[查看本次审核](https://appstoreconnect.apple.com/apps/6832138968/distribution/reviewsubmissions/details/bcd205f5-266d-44ac-b6b2-ef4e8368a825)。

## 已确认的发行设置

- App Store Connect：[Story: A Sound Journal](https://appstoreconnect.apple.com/apps/6832138968/distribution/ios/version/inflight)，中文名称「声音 Story: 今生不再」，Apple ID `6832138968`，SKU `story-ios-001`。
- 免费，无广告、无应用内购买。174 个国家或地区发行，排除中国大陆；审核通过后自动发布。
- 英文为主要语言，简体中文为海外商店本地化。主分类 Music / 音乐，年龄问卷结果 4+（部分地区显示当地分级），不申报儿童专用 App。
- 隐私标签已发布为 Data Not Collected / 未收集数据。App 只播放本地音频，无账号、广告或分析 SDK。反馈由用户在自己的邮件客户端确认发送。
- 提交时根据发行人当时的确认，将内容版权声明为不包含第三方内容。2026-11-08 发行人补充说明：Armani @ Burj Khalifa 录音包含酒店房间播放的背景音乐，创作者及来源尚未确认，因此该段音乐的发行授权仍待核实。发行人决定先等待本次 Apple 审核结果；当前构建和商店声明尚未修改。审核通过本身不代表取得音乐授权。
- 发行人自评为纯个人爱好，按 DSA 非经营者申报；Apple 显示合规状态有效。
- 审核联系人已填写到 Apple 后台，不将私人电话号码保存在材料包中。无演示账号或登录要求。
- 首发为 iPhone；未开启 Apple 芯片 Mac 与 Apple Vision Pro 的兼容分发。

## 文案和截图

`listing-en-US.md`、`listing-zh-Hans.md` 保存双语名称、副标题、关键词、描述与推广文本。`review-notes.txt` 保存英文审核说明。

2026-11-08 使用当前源码的 iOS 27.2 模拟器重新采集，包含最新的纯数字定时按钮和联系入口：

- `screenshots/en-US/`、`screenshots/zh-Hans/` 每种语言四张 1206 × 2622 的普通 iPhone 图：森林播放器、长沙五十分钟雨夜、迪拜睡眠定时和录音目录。
- `screenshots/Duo/en-US/`、`screenshots/Duo/zh-Hans/` 每种语言各两张，横向外屏 2034 × 1398、竖向内屏 2007 × 2853，分别介绍帐篷播放和展开后声音、睡眠倒计时连续的体验。
- `screenshots/manifest.json` 记录正式文件、文案和来源。新设计采用私人旅行手记的版式，普通 iPhone 四张主题依次为历年录音选集第一部分、五十分钟长沙夜雨、睡眠定时和离线收听。首张及录音目录说明今后会持续更新；中英文商店介绍和推广文本也同步说明首批六段与后续录音计划。
- 所有上传文件为无 alpha 的 RGB PNG。`StoreSources/Captures/` 保存未经修饰的原始界面截图。运行 `python3 Tools/compose-store-concept.py` 在 `ScreenshotDrafts/field-notes/` 生成新风格草稿，确认后再同步至 `screenshots/` 正式目录。旧脚本 `compose-store-screens.py` 仅用于复现上一套版式，不应用于当前正式素材。
- 替换前的十二张截图已备份到 `build/releases/Story-1.1-6/screenshots-before-rename.zip`；Apple 素材库也保留原素材。
- 图标由发行构建内的 AppIcon 提供；材料包 Artwork/Story-1024.png 是同一张黑底金色迪拜塔尖图标。

## 支持与隐私网址

2026-11-08 已验证以下网址免登录返回成功页面：

- Support URL：https://zhuhong.me/story/
- Privacy Policy URL：https://zhuhong.me/story/privacy.html
- Marketing URL：https://zhuhong.me/story/about.html

英文隐私 URL 使用 `#en`，中文链接使用 `#zh`。网站源码位于 `website/`，与 App 内离线帮助一致；已同步到 Web V2 的 `/Users/hoo/zhuhong-journal/story/`。以后更新后运行 `python3 Tools/package-support-website.py`，并将五个网页文件同步至 Web V2 后部署。

联系邮箱为 zivzhu@gmail.com。设置和播放列表底部均提供写信、报告问题、帮助、关于及隐私入口。问题反馈可由用户编辑、取消附带信息，再在邮件 App 中确认发送；不自动上传。

## 签名、归档与后续更新

- 正式团队为 Hong Zhu，Team ID `KW9NTQUH4T`。主应用 `com.mlikeason.Story`，扩展 `com.mlikeason.Story.Widget`，共享组 `group.com.mlikeason.Story`。这些是已注册的正式标识，后续更新应沿用。
- 主应用与扩展均使用同一团队和已注册 App Group。Release 生成 dSYM。已声明 `ITSAppUsesNonExemptEncryption = NO`；若以后引入自定义加密或 SDK，须重新判断。
- Xcode 27.2 / iOS 27.2 SDK 构建，最低支持 iOS 16。已完成签名归档、App Store 分发导出与上传。IPA 约 74.89 MiB；商店下载大小以 Apple 设备裁剪后的结果为准。
- 本机归档和 IPA 保留在被 Git 忽略的 `build/releases/Story-1.1-6/`；两个 target 的版本均为 1.1（6）。后续上传需要递增构建号。
- 2026-11-08 同源码 Release 开发签名版已部署到 M17Air 和 ML Duo Black，两台均成功启动。此安装不是 TestFlight 安装；App Store 审核与实际商店分发状态应分别确认。
- 原有功能回归包含横竖屏布局、播放与暂停、睡眠定时、语言、反馈和 Duo 展开连续性。本轮更新发行签名、构建号与商店截图，没有改动播放逻辑。

Apple 参考：[截图要求](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)、[审核指南](https://developer.apple.com/app-store/review/guidelines/)、[隐私问卷](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)、[欧盟经营者声明](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)。
