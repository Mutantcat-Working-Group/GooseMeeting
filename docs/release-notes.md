# 大鹅会议 / GooseMeeting 1.0.20260920

## 本次更新 / What's New

- 应用图标统一使用新的 `logo.png`，覆盖 Windows、macOS、Linux 桌面应用及网页图标。
- 中英文 README 按统一的编号章节格式重新整理，补充开发进度和图标说明。
- 产品版本升级至 `1.0.20260920`；Windows 原生数字版本为 `1.0.2026.920`。

- Use the new `logo.png` for Windows, macOS, Linux application icons and web branding.
- Restructure both READMEs with numbered sections, development status and icon documentation.
- Bump the product version to `1.0.20260920`; the Windows native numeric version is `1.0.2026.920`.

## 安装说明 / Installation

下载与系统架构匹配的安装包。无需安装 Node.js 或 Rust；会议后端需独立部署，首次启动请在登录页输入服务器地址。

Download the installer matching your operating system and architecture. Node.js and Rust are not required. A separately deployed meeting backend is required; enter its address on the login screen.

| Platform | Artifact | Installation |
| --- | --- | --- |
| Windows x64 | `windows-x64.exe` | NSIS installer; includes the offline WebView2 runtime installer |
| macOS Intel | `macos-x64.dmg` | Open DMG and drag GooseMeeting into Applications |
| macOS Apple Silicon | `macos-arm64.dmg` | Open DMG and drag GooseMeeting into Applications |
| Linux x64 | `linux-x64.AppImage` | Enable executable permission, then open; FUSE 2 may be required |

macOS 应用和 DMG 均为 ad-hoc 签名，未经过 Apple 公证。首次打开可能需要在“系统设置 > 隐私与安全性”中允许打开。Windows 安装包未作商业代码签名，可能出现 SmartScreen 提示。请核对仓库来源和 SHA256SUMS.txt。

The macOS application and DMG are ad-hoc signed, not Apple-notarized. Gatekeeper may require approval in System Settings > Privacy & Security. Windows installers are not commercially code-signed and may show SmartScreen warnings. Verify the repository source and SHA256SUMS.txt before installation.

Linux: `chmod +x goosemeeting_*_linux-x64.AppImage`. On systems without FUSE, extract with `--appimage-extract` and run `squashfs-root/AppRun`. Distribution compatibility and WebRTC/screen capture capabilities depend on system WebKitGTK, media drivers and permissions.

客户端使用系统 WebView；摄像头、麦克风和屏幕共享能力取决于平台、系统权限及 WebView 实现。macOS 首次授权后可能需要重启应用。此版本不包含会议服务端，也不代表上游服务端已完成安全加固。

The client uses the system WebView. Camera, microphone and screen sharing depend on platform support and OS permissions; macOS may require an application restart after granting permissions. This release does not bundle the meeting server or resolve upstream server authorization issues.
