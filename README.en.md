# goosemeeting (大鹅会议)

An open-source WebRTC video meeting frontend with audio and video calls, screen sharing, meeting chat, and participant management.

[简体中文](README.md) | **English**

[Repository](https://github.com/Mutantcat-Working-Group/GooseMeeting) · [Issues](https://github.com/Mutantcat-Working-Group/GooseMeeting/issues) · [MIT License](LICENSE)

## Project Status

- Product name: **大鹅会议** in Chinese and `goosemeeting` in English.
- npm package name: `org.mutantcat.goosemeeting`. This is not an API path prefix.
- Current version: **1.0.20260919**.
- This repository provides a Vue web client and a Tauri 2 desktop client. The backend must be deployed separately; no Java packages or Maven modules are included.

> Production security hardening and multi-device integration testing are still required. Read [Security and Limitations](#security-and-limitations) before deploying. Frontend management controls are not a substitute for server-side authorization.

## Features

- Create or join password-protected meeting rooms.
- Camera and microphone calls, screen sharing, and media source switching.
- Participant video previews and an enlarged video view.
- Meeting text chat and notification messages.
- Host controls for chat restrictions, microphone muting, video disabling, and participant removal.
- User management, dictionary management, and spreadsheet export.

WebRTC carries audio and video over peer-to-peer connections. WebSocket carries signaling and chat messages. The current multi-party peer-to-peer topology increases each client's connection count, upload bandwidth, and CPU usage as more participants join.

## Desktop Downloads

Download installers from [GitHub Releases](https://github.com/Mutantcat-Working-Group/GooseMeeting/releases). Node.js and Rust are not required to run them.

| System | Installer | Installation |
| --- | --- | --- |
| Windows 10/11 x64 | `windows-x64.exe` | NSIS installer with the offline WebView2 runtime installer |
| macOS 12+ Intel | `macos-x64.dmg` | Open and drag into Applications |
| macOS 12+ Apple Silicon | `macos-arm64.dmg` | Open and drag into Applications |
| Linux x64 | `linux-x64.AppImage` | Mark executable and open; Ubuntu 22.04 or a newer compatible distribution recommended |

Enter the meeting server HTTP(S) address on the login screen. It is saved locally; switching servers clears the login token. There is no bundled public meeting service. The backend must allow CORS from `tauri://localhost` on macOS/Linux, `http://tauri.localhost` on Windows, and `http://127.0.0.1:1420` in development. Use trusted HTTPS/WSS in production.

Both the macOS application and DMG are **ad-hoc signed**, not Developer ID signed or Apple-notarized. Gatekeeper may require approval in System Settings > Privacy & Security. Windows binaries are not commercially code-signed and may show SmartScreen warnings. Verify the release source and `SHA256SUMS.txt`; do not globally disable system security checks.

Linux may need `chmod +x goosemeeting_*_linux-x64.AppImage` and FUSE 2. Without FUSE, use `--appimage-extract` and run `squashfs-root/AppRun`. Media and screen sharing depend on the system WebView, graphics drivers, codecs and OS permissions; not every distribution or WebView supports screen sharing.

## Screenshots

These are historical screenshots retained in the repository. Names and interface details may differ from the current version.

![Historical interface preview 1](image/1.jpg)

<details>
<summary>More historical screenshots</summary>

![Historical interface preview 2](image/2.jpg)
![Historical interface preview 3](image/3.jpg)
![Historical interface preview 4](image/4.jpg)

</details>

## Technology Stack

| Area | Technology |
| --- | --- |
| Interface and components | Vue 2, Element UI |
| Routing and state | Vue Router 3, Vuex 3 |
| Communication | Axios, WebSocket, WebRTC, webrtc-adapter |
| Build tooling | Vue CLI 3, Webpack 4.47, Dart Sass |
| Desktop | Tauri 2, Rust, system WebView |
| Quality checks | ESLint, Jest, Vue Test Utils |

## Quick Start

### Requirements

- **Node.js 22**, which has been tested with this project, and npm.
- A modern browser with WebRTC support. Screen sharing capabilities vary by browser and operating system.
- A compatible, separately deployed backend. See the upstream [MeetingServer](https://github.com/nnn149/MeetingServer), and review its authorization implementation before use as described in the security section.

The project uses Dart Sass instead of Node Sass. Native Node Sass build dependencies and the OpenSSL legacy provider are not required.

### Installation and Configuration

```sh
git clone https://github.com/Mutantcat-Working-Group/GooseMeeting.git
cd GooseMeeting
npm ci --ignore-scripts
```

Create `.env.development.local` in the project root and configure a reachable backend URL:

```dotenv
VUE_APP_BASE_API=http://localhost:8080
```

This URL is only an example for a local backend. The default `192.168.2.200` address in the repository is not a public service and must be overridden for your environment. Files matching `*.local` are ignored by Git.

```sh
npm run dev
```

The default URL is [http://localhost:8081](http://localhost:8081). Use the actual address printed in the terminal. To specify the host and port:

```sh
npm run dev -- --host 127.0.0.1 --port 8082
```

### Backend Connectivity

- The backend must allow CORS requests from the frontend origin, including the `Authorization` header.
- The WebSocket URL returned by `/WebrtcWs/url` must be reachable from participants' devices.
- HTTPS pages should connect to HTTPS APIs and WSS signaling services to avoid mixed-content blocking.
- Environment variables are injected at startup or build time. Restart the development server or rebuild after changing them. `VUE_APP_*` variables are included in frontend assets and must not contain secrets.

## Build and Deployment

Configure the production backend in `.env.production.local`, for example:

```dotenv
VUE_APP_BASE_API=https://api.example.com
```

```sh
npm run build:prod
```

Deploy the generated `dist/` directory to a static server. The current `publicPath` is `/`, so deployment at the site root is the default. Update `vue.config.js` when deploying under a subpath. Use a trusted HTTPS certificate in production; the development server is not intended for production hosting.

Camera, microphone, and screen capture require a secure context. HTTP is supported on local `localhost`, while LAN IP and public access should use HTTPS. The development server accepts `HOST` and `HTTPS=true` environment variables, but its development certificate still needs to be trusted by the browser.

## Development and Verification

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the web development server |
| `npm run lint` | Check JavaScript and Vue code |
| `npm run test:unit -- --runInBand` | Run unit tests serially |
| `npm run build:prod` | Build production static assets |
| `npm run build:stage` | Build in staging mode |
| `npm run desktop:dev` | Start Tauri desktop development |
| `npm run desktop:build -- --bundles dmg` | Build a macOS DMG on macOS |
| `npm run desktop:build -- --bundles nsis` | Build a Windows NSIS installer on Windows |
| `npm run desktop:build -- --bundles appimage` | Build a Linux AppImage on Linux |
| `npm run release:check` | Validate versions and platform mapping |

Desktop development requires stable Rust and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/): Xcode command-line tools on macOS, MSVC C++ tools on Windows, and WebKitGTK 4.1 plus GStreamer on Linux. Frontend assets are embedded in the desktop bundle; development uses port 1420. Both `package-lock.json` and `src-tauri/Cargo.lock` are committed.

Use `.env.staging.local` to override the staging backend URL. Unit tests cover selected regressions in signaling, media lifecycle, admin lists, and authentication state. They do not replace real-device testing of media permissions, multi-party calls, or connectivity across networks.

## Automated Releases

`.github/workflows/ci.yml` runs version validation, ESLint, unit tests and a web build on master pushes and pull requests. `.github/workflows/release.yml` builds four native targets when a `v*` tag is pushed. Only after every build succeeds are all four installers and SHA-256 checksums uploaded and the Release published. A failed build does not publish an incomplete new release.

Update the application version in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`, commit, then push a matching version tag:

```sh
git tag v1.0.20260919
git push origin v1.0.20260919
```

The Desktop Release workflow can also be dispatched manually with an existing version tag. It uses the built-in `GITHUB_TOKEN`; the publishing job needs `contents: write`. No Apple certificate or paid signing secret is needed for the default build.

Public versions use `major.minor.YYYYMMDD`. Windows numeric resource fields are limited to 65535 per part, so packaging maps the version to `1.0.2026+919` (native four-part `1.0.2026.919`). The UI, tag, release and download filenames retain `1.0.20260919`. Moving from the upstream template's `4.2.1` establishes the product's first release version; it is not a dependency upgrade.

## Project Structure

```text
src/
  api/                 HTTP API wrappers
  components/          Shared components
  router/              Route configuration
  store/               Vuex state management
  utils/               Requests, authentication, and utilities
  views/
    meeting/           Signaling, media, and meeting chat
    login/             Login and registration
    user/              User management
    dictionary/        Dictionary management
mock/                  Template mock data, not a real meeting backend
public/                Static entry assets
tests/unit/            Unit tests
src-tauri/             Desktop entry, bundle configuration, permissions and icons
scripts/               Desktop build and release validation scripts
.github/workflows/     CI and cross-platform releases
docs/                  Release notes and implementation checklist
vue.config.js          Frontend build and development server configuration
```

## Security and Limitations

- **Server-side authorization:** The reviewed public upstream backend forwards management signals without verifying host privileges. Before deployment, enforce identity, room membership, and management permissions on the server. Do not trust client-provided administrator flags. This frontend repository cannot independently fix that issue.
- **Cross-network calls:** Only STUN is configured; no TURN relay is provided. Restrictive NATs and corporate firewalls may prevent calls from connecting. Configure TURN and test across networks before production use.
- **Dependency maintenance:** Vue 2 and several dependencies are old. Build compatibility fixes do not constitute security upgrades. Audit dependencies and assess upgrades before public deployment.
- **Scale and compatibility:** The peer-to-peer topology does not guarantee support for arbitrary participant counts. Browser permissions, devices, and operating systems also affect media functionality.

## Contributing

Report bugs through [Issues](https://github.com/Mutantcat-Working-Group/GooseMeeting/issues) or submit a pull request. Include your operating system, browser, Node.js version, reproduction steps, and sanitized logs. Never include tokens, room passwords, or other sensitive information in public reports.

Run linting, unit tests, and a production build before submitting code. WebRTC changes should include relevant regression tests and describe the platforms and network conditions actually tested.

## Attribution and License

This project is based on [MeetingWeb](https://github.com/nnn149/MeetingWeb), with an admin interface inherited from [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin). Thanks to the original authors and contributors.

This project is released under the **MIT License**. See [LICENSE](LICENSE) for the full terms. Existing copyright notices are retained; copies or substantial portions of the software must include the copyright and permission notices. Third-party dependencies remain subject to their own licenses.
