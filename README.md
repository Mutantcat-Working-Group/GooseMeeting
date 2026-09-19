# 大鹅会议 (goosemeeting)

基于 WebRTC 的开源视频会议前端，支持音视频通话、屏幕共享、会议聊天和成员管理。

**简体中文** | [English](README.en.md)

[项目仓库](https://github.com/Mutantcat-Working-Group/GooseMeeting) · [问题反馈](https://github.com/Mutantcat-Working-Group/GooseMeeting/issues) · [MIT 协议](LICENSE)

## 项目状态

- 产品名称：**大鹅会议**；英文名称：`goosemeeting`。
- npm 包名：`org.mutantcat.goosemeeting`，不作为 API 路径前缀。
- 当前版本：**1.0.20260919**。
- 当前仓库提供 Vue 网页客户端和 Tauri 2 桌面客户端，后端需要独立部署，不包含 Java 包或 Maven 模块。

> 当前项目仍需完成生产环境安全加固和多设备联调。请先阅读下方的[安全与限制](#安全与限制)，不要将前端管理按钮视为服务端权限保障。

## 功能

- 创建或加入带密码的会议房间。
- 摄像头与麦克风通话、屏幕共享和视频源切换。
- 成员视频预览及大画面查看。
- 会议文字聊天和通知消息。
- 房主管理入口：禁言、静音、关闭视频和移除成员。
- 用户管理、字典管理及表格导出。

音视频通过 WebRTC 点对点传输，WebSocket 用于会议信令和聊天。当前采用多人点对点连接，参与人数增加时，每位客户端的连接数、上行带宽和 CPU 消耗都会增加。

## 桌面客户端下载

在 [GitHub Releases](https://github.com/Mutantcat-Working-Group/GooseMeeting/releases) 下载对应安装包，无需安装 Node.js 或 Rust。

| 系统 | 安装包 | 安装方式 |
| --- | --- | --- |
| Windows 10/11 x64 | `windows-x64.exe` | NSIS 安装程序，包含 WebView2 离线运行库安装程序 |
| macOS 12+ Intel | `macos-x64.dmg` | 打开后拖入 Applications |
| macOS 12+ Apple Silicon | `macos-arm64.dmg` | 打开后拖入 Applications |
| Linux x64 | `linux-x64.AppImage` | 赋予可执行权限后启动，建议 Ubuntu 22.04 或更新的兼容发行版 |

首次启动在登录页填写会议服务器的 HTTP(S) 地址；地址保存在本机，修改地址会清除登录令牌。桌面版没有内置公共会议服务。服务器必须允许桌面来源的 CORS 请求：macOS/Linux 为 `tauri://localhost`，Windows 为 `http://tauri.localhost`，开发模式为 `http://127.0.0.1:1420`。生产服务请使用可信 HTTPS/WSS。

macOS 应用和 DMG 均采用 **ad-hoc 签名**，不等于 Developer ID 签名或 Apple 公证，Gatekeeper 仍可能要求在“系统设置 > 隐私与安全性”中允许打开。Windows 未作商业代码签名，可能出现 SmartScreen 提示。请核对发布来源与 `SHA256SUMS.txt`，不要全局关闭系统安全检查。

Linux 首次运行可能需要 `chmod +x goosemeeting_*_linux-x64.AppImage` 及 FUSE 2。无 FUSE 时可使用 `--appimage-extract` 后运行 `squashfs-root/AppRun`。系统 WebView、图形驱动、媒体编解码器和系统权限决定音视频与屏幕共享兼容性，不承诺所有发行版或 WebView 均支持屏幕共享。

## 界面预览

以下为仓库保留的历史截图，名称和界面细节可能与当前版本不同。

![历史界面预览 1](image/1.jpg)

<details>
<summary>查看其余历史截图</summary>

![历史界面预览 2](image/2.jpg)
![历史界面预览 3](image/3.jpg)
![历史界面预览 4](image/4.jpg)

</details>

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 页面与组件 | Vue 2、Element UI |
| 路由与状态 | Vue Router 3、Vuex 3 |
| 通信 | Axios、WebSocket、WebRTC、webrtc-adapter |
| 构建 | Vue CLI 3、Webpack 4.47、Dart Sass |
| 桌面 | Tauri 2、Rust、系统 WebView |
| 质量检查 | ESLint、Jest、Vue Test Utils |

## 快速开始

### 环境要求

- 推荐使用已验证的 **Node.js 22** 和 npm。
- 使用支持 WebRTC 的现代浏览器；屏幕共享能力因浏览器和操作系统而异。
- 部署兼容的后端，可参考上游 [MeetingServer](https://github.com/nnn149/MeetingServer)。运行前应检查其权限实现，详见安全说明。

项目已使用 Dart Sass 替代 Node Sass，无需安装 Node Sass 原生编译依赖，也无需启用 OpenSSL legacy provider。

### 安装与配置

```sh
git clone https://github.com/Mutantcat-Working-Group/GooseMeeting.git
cd GooseMeeting
npm ci --ignore-scripts
```

在项目根目录创建 `.env.development.local`，设置可访问的后端地址：

```dotenv
VUE_APP_BASE_API=http://localhost:8080
```

该地址仅为本机后端示例。仓库默认配置中的 `192.168.2.200` 不是公共服务，需要根据部署环境覆盖。`*.local` 文件已被 Git 忽略。

```sh
npm run dev
```

默认访问 [http://localhost:8081](http://localhost:8081)，实际地址以终端输出为准。可指定端口和监听地址，例如：

```sh
npm run dev -- --host 127.0.0.1 --port 8082
```

### 后端连接要求

- 后端需允许前端来源的 CORS 请求及 `Authorization` 请求头。
- `/WebrtcWs/url` 返回的 WebSocket 地址必须能被参与者的设备访问。
- HTTPS 页面应连接 HTTPS API 和 WSS 信令服务，避免混合内容被浏览器拦截。
- 环境变量在启动或构建时注入；修改后需重启开发服务或重新构建。`VUE_APP_*` 会进入前端产物，不可存放密钥。

## 构建与部署

在 `.env.production.local` 中配置生产后端，例如：

```dotenv
VUE_APP_BASE_API=https://api.example.com
```

```sh
npm run build:prod
```

将生成的 `dist/` 部署到静态服务器。当前 `publicPath` 为 `/`，默认部署在站点根路径；部署到子路径时需同步调整 `vue.config.js`。生产环境应配置可信 HTTPS 证书，开发服务器不用于生产托管。

摄像头、麦克风和屏幕共享需要安全上下文。本机 `localhost` 可使用 HTTP，局域网 IP 或公网访问应使用 HTTPS。开发服务器支持通过 `HOST` 与 `HTTPS=true` 环境变量配置地址及 HTTPS，但开发证书仍需浏览器信任。

## 开发与验证

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动网页开发服务 |
| `npm run lint` | 检查 JavaScript 和 Vue 代码 |
| `npm run test:unit -- --runInBand` | 串行执行单元测试 |
| `npm run build:prod` | 构建生产静态文件 |
| `npm run build:stage` | 使用 staging 模式构建 |
| `npm run desktop:dev` | 启动 Tauri 桌面开发环境 |
| `npm run desktop:build -- --bundles dmg` | 本机 macOS DMG 构建 |
| `npm run desktop:build -- --bundles nsis` | 本机 Windows NSIS 构建 |
| `npm run desktop:build -- --bundles appimage` | 本机 Linux AppImage 构建 |
| `npm run release:check` | 校验版本及平台兼容映射 |

桌面开发需要 Rust 稳定版及 [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)。macOS 需要 Xcode 命令行工具，Windows 需要 MSVC C++ 工具，Linux 需要 WebKitGTK 4.1 和 GStreamer。桌面前端资源会内嵌打包；开发端口为 1420。`package-lock.json` 和 `src-tauri/Cargo.lock` 已纳入版本控制。

staging 环境可使用 `.env.staging.local` 覆盖后端地址。单元测试覆盖部分会议信令、媒体生命周期、后台列表和登录状态的回归场景，但不能替代真实设备上的媒体权限、多人通话及跨网络连通性测试。

## 自动发布

`.github/workflows/ci.yml` 在 master 推送及 Pull Request 时执行版本检查、ESLint、单元测试和网页构建。`.github/workflows/release.yml` 在推送 `v*` 标签时运行四目标原生构建。全部成功后上传四份安装包和 SHA-256 校验清单，再发布 Release；构建失败不会发布不完整的新版本。

发布前同步修改 `package.json`、`package-lock.json`、`src-tauri/Cargo.toml` 和 `src-tauri/Cargo.lock` 中的应用版本，提交后推送版本标签：

```sh
git tag v1.0.20260919
git push origin v1.0.20260919
```

也可通过 Actions 的 Desktop Release 工作流手动选择已经存在的版本标签重试。工作流仅用仓库自带 `GITHUB_TOKEN`，发布任务需要 `contents: write`。构建默认无需 Apple 证书或付费签名密钥。

公开版本格式为 `主版本.次版本.YYYYMMDD`。Windows 数字资源字段每段上限为 65535，因此打包时映射为 `1.0.2026+919`（原生四段 `1.0.2026.919`）；界面、标签、Release 和下载文件名保留完整 `1.0.20260919`。这次从上游模板的 `4.2.1` 改为产品首发版本，不代表模板依赖版本升级。

## 目录结构

```text
src/
  api/                 HTTP API 封装
  components/          通用组件
  router/              路由配置
  store/               Vuex 状态管理
  utils/               请求、认证和通用工具
  views/
    meeting/           会议信令、媒体和聊天界面
    login/             登录与注册
    user/              用户管理
    dictionary/        字典管理
mock/                  模板 Mock 数据，不是真实会议后端
public/                静态入口资源
tests/unit/            单元测试
src-tauri/             桌面入口、打包配置、权限及图标
scripts/               桌面构建与发布校验脚本
.github/workflows/     CI 与跨平台 Release
docs/                  发布说明和实施清单
vue.config.js          前端构建与开发服务配置
```

## 安全与限制

- **服务端授权**：审查的公开上游后端会转发管理信令，但未校验房主管理权限。部署前必须在服务端验证身份、房间归属和管理权限，不能信任客户端提供的管理员标记。当前前端仓库无法独立修复该问题。
- **跨网通话**：当前只有 STUN 配置，没有 TURN 中继；严格 NAT、企业防火墙等网络可能无法建立通话。生产部署应配置 TURN 并进行跨网络测试。
- **依赖维护**：Vue 2 及多项依赖已较旧。构建兼容修复不代表完成安全升级，公网部署前需进行依赖审计和升级评估。
- **规模与兼容性**：点对点拓扑不承诺任意人数可用；浏览器权限、设备和系统差异也会影响媒体功能。

## 贡献

欢迎通过 [Issues](https://github.com/Mutantcat-Working-Group/GooseMeeting/issues) 报告问题或提交 Pull Request。复现信息请包含操作系统、浏览器、Node.js 版本、操作步骤及脱敏日志。不要在公开反馈中提交令牌、房间密码或其他敏感信息。

提交代码前请运行代码检查、单元测试和生产构建。涉及 WebRTC 的修改应补充对应回归测试，并说明实际验证的平台与网络环境。

## 来源与协议

本项目基于 [MeetingWeb](https://github.com/nnn149/MeetingWeb)，管理界面继承自 [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin)。感谢原项目作者及贡献者。

本项目采用 **MIT 开源协议**，完整条款见 [LICENSE](LICENSE)。保留原有版权声明；复制或分发本软件及其实质性部分时，应一并保留版权声明和许可文本。第三方依赖遵循各自的许可证。
