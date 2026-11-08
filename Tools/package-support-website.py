#!/usr/bin/env python3
"""Package the bundled support pages for the owner's static /story/ directory."""
from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
files = {
    "support.html": "index.html",
    "support.css": "support.css",
    "support.js": "support.js",
    "about.html": "about.html",
    "privacy.html": "privacy.html",
}
package = root / "Story-Website-Upload"
for target in (root / "AppStore/website", root / "Story-App-Store/website", package / "story"):
    target.mkdir(parents=True, exist_ok=True)
    for source, destination in files.items():
        shutil.copy2(root / "Resources" / source, target / destination)

instructions = """Story 网站上传文件

只需上传 story 文件夹，完整保留其中五个文件及目录结构。

目标位置
https://zhuhong.me/story/

如果你的网站是纯静态文件，把 story 放到网站发布根目录，与主页 index.html 同级。
如果使用带公开静态目录的框架，把 story 放入对应目录（常见位置为 public/story），再按你的网站原有方式部署。

上架时使用
Support URL: https://zhuhong.me/story/
Privacy Policy URL: https://zhuhong.me/story/privacy.html
作者介绍: https://zhuhong.me/story/about.html
英文为默认语言，中文链接在末尾加 #zh。

上传后检查
1. 用未登录的浏览器打开上述三个地址。
2. 切换 English / 简体中文，确认样式和文字正常。
3. 在支持页选择反馈类型，检查邮件草稿与复制按钮。
4. 在介绍页打开 zhuhong.me 个人主页。

这些页面使用相对路径加载样式和脚本，无需构建或服务器程序。
App 内仍保留离线副本；在线查看入口在这些文件上传后生效。
"""
(package / "README.txt").write_text(instructions, encoding="utf-8")
archive = root / "Story-Website-Upload.zip"
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as output:
    for name in ["README.txt"] + ["story/" + name for name in files.values()]:
        output.write(package / name, name)
print(package)
print(archive)
