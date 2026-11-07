# Story 海外首发材料

更新日期：2026-11-07。首发地区由发行人在 App Store Connect 逐项选择，排除中国大陆。英文为主要商店语言，简体中文是海外商店的本地化。尚未上传构建或提交审核，开发者会员状态在正式发行前核实。

## 填写商店页面

- 英文与简体中文的名称、副标题、关键词、描述及可选推广文案分别在 `listing-en-US.md`、`listing-zh-Hans.md`。首次创建记录时确认名称可用；推荐主分类 **Music / 音乐**。定价由发行人决定。
- `review-notes.txt` 可以直接粘贴到 App Review Notes。无需演示账号。审核联系人姓名、可接通的国际格式电话和邮箱由发行人填入 App Store Connect，不公开在这个材料包里。
- `screenshots/en-US/`、`screenshots/zh-Hans/`：每种语言各四张 1206 × 2622 的普通 iPhone 图，由真实模拟器截图配本地化标题：新版森林播放器、长沙五十分钟雨夜、迪拜与睡眠定时、六段录音目录。`screenshots/Duo/`：按 en-US 和 zh-Hans 分目录；同一场长沙雨夜在 Duo 横向外屏和竖向内屏的截图分别为 2034 × 1398、2007 × 2853。分配到相应设备槽位。所有文件为无 alpha 的 RGB PNG。
- 主图标已内置在 AppIcon 资源目录中。材料包内的 Artwork/Story-1024.png 是黑底金色迪拜塔尖图标，与 AppIcon 使用同一张 1024 × 1024 不透明 PNG。商店从发行构建提取图标。
- 建议的 App 隐私回答为 **Data Not Collected（未收集数据）**。本版本播放本地音频，没有账号、广告、分析 SDK、远程字体或后台上传。收藏、语言和定时留在设备。用户通过自己的邮件客户端主动联系支持。正式提交前以实际发行构建及接入的服务复核。
- 当前工程没有自定义加密实现或第三方加密库，主 App 已声明 `ITSAppUsesNonExemptEncryption = NO`。如以后增加网络服务、SDK 或加密实现，请重新判断。
- 年龄分级按内容如实填写。此版本没有应用内购买、聊天、用户发布内容或开放网页浏览。实际分级以 Apple 对问卷的计算为准，不宣称针对儿童设计。仅在按 Apple 标准完成验证后填写对应的无障碍支持标签。

## 支持与隐私网址

`website/` 包含支持首页 `index.html`、`support.css`、`support.js`、隐私页 `privacy.html` 和作者介绍 `about.html`，需要一起部署。英文链接使用 `#en`，中文使用 `#zh`。网页来源与 App 内离线帮助一致；作者个人网站在系统浏览器打开。

已公开部署并检查免登录访问。Support URL：https://story-field-notes-support.indigoeft8192.chatgpt.site/ 。Privacy Policy URL：https://story-field-notes-support.indigoeft8192.chatgpt.site/privacy.html 。作者介绍：https://story-field-notes-support.indigoeft8192.chatgpt.site/about.html 。可按商店语言添加 `#en` 或 `#zh`。

联系邮箱沿用 zivzhu@gmail.com。设置和播放列表底部均提供写信、报告问题、帮助、关于及隐私入口。问题反馈会展示可编辑、可取消附带的设备与录音信息，由用户在邮件 App 中确认发送。后续修改 `Resources/support.html`、`support.css`、`support.js`、`privacy.html` 或 `about.html` 时，同步到 `website/`（其中 support.html 对应 index.html）和 `SupportSite/dist/`，再保存与部署网站版本。

## 发行团队与正式归档

1. 加入 Apple Developer Program 或使用有发布权限的付费团队；由账号持有人处理协议。若为付费下载，先完成所需的付费协议、税务及银行信息。
2. 当前仓库的标识为 `com.mlikeason.Story`、`com.mlikeason.Story.Widget` 和 `group.com.mlikeason.Story`。本机旧的 Story 工程还使用过 `me.zhuhong.Story`。先确认这是首发还是已有产品的更新，以及哪个账号控制正式标识。如果已有商店记录，沿用该记录对应的 ID。不要选真机调试的 DuoTest 标识。
3. 为主应用和扩展选择同一发行团队。为两个显式 App ID 启用 App Groups，关联同一已注册的共享组，并核对两份发行描述文件包含该组。用正式签名版本复核：在 App 里改中文，确认每日录音组件同步语言、能播放与暂停。此前真机测试版使用单独 ID 和本机独立偏好，不验证发行版的共享组权限。
4. 当前版本 1.1（构建 5），最低 iOS 16，设备系列为 iPhone。若构建号已被同版本上传使用，先递增。选择通用 iOS 真机目标执行 Product → Archive，在 Organizer 中 Validate App，再向 App Store Connect 上传。当前无签名 Release 归档只用于包结构预检，不能直接上传。处理完成后先在 TestFlight 做一次发行包验收。
5. 由发行人确认六段录音及商用素材的权利，尤其是课堂、酒店内可能收录的可识别讲话或背景音乐，以及名称、标语、图标、插图的使用。审核问卷的内容权利、版权持有人和定价以你的实际情况为准。
6. 选择具体首发国家或地区。完成 App Store Connect 的 DSA 经营者身份声明；若选择欧盟且为经营者，还需完成 Apple 要求的联系方式验证。名称保留、内容权利、年龄问卷、隐私标签、公开网页及审核联系人齐备后，选择构建并提交。

## 已验证

用本机 iOS 27.2 SDK 对正式工程进行 Release Archive（不签名）。归档中存在主 App、Widget 扩展、两份隐私清单、双语资源、全部六段音频及各自的插画；不包含真机调试的播放采样代码。塔尖图标是 1024 × 1024 的不透明 RGB 资源。普通 iPhone 的横竖屏居中、播放／暂停、定时到期、语言和 Duo 布局经过界面回归测试。Apple 的服务器签名验证和审核要等付费团队与正式构建。

Apple 参考：[开发者会员](https://developer.apple.com/programs/whats-included/)、[截图要求](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)、[审核指南](https://developer.apple.com/app-store/review/guidelines/)、[隐私问卷](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)、[欧盟经营者声明](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)。
