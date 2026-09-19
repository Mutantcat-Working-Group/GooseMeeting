# goosemeeting (大鹅会议)

An open-source WebRTC video meeting frontend with audio and video calls, screen sharing, meeting chat, and participant management.

[简体中文](README.md) | **English**

[Repository](https://github.com/Mutantcat-Working-Group/GooseMeeting) · [Issues](https://github.com/Mutantcat-Working-Group/GooseMeeting/issues) · [MIT License](LICENSE)

## Project Status

- Product name: **大鹅会议** in Chinese and `goosemeeting` in English.
- npm package name: `org.mutantcat.goosemeeting`. This is not an API path prefix.
- This repository provides a Vue web client. The backend must be deployed separately; no Java packages or Maven modules are included.
- Tauri desktop integration has not been implemented. No desktop installers or Tauri build commands are currently available.

> Production security hardening and multi-device integration testing are still required. Read [Security and Limitations](#security-and-limitations) before deploying. Frontend management controls are not a substitute for server-side authorization.

## Features

- Create or join password-protected meeting rooms.
- Camera and microphone calls, screen sharing, and media source switching.
- Participant video previews and an enlarged video view.
- Meeting text chat and notification messages.
- Host controls for chat restrictions, microphone muting, video disabling, and participant removal.
- User management, dictionary management, and spreadsheet export.

WebRTC carries audio and video over peer-to-peer connections. WebSocket carries signaling and chat messages. The current multi-party peer-to-peer topology increases each client's connection count, upload bandwidth, and CPU usage as more participants join.

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
npm install --legacy-peer-deps
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

Use `.env.staging.local` to override the staging backend URL. Unit tests cover selected regressions in signaling, media lifecycle, admin lists, and authentication state. They do not replace real-device testing of media permissions, multi-party calls, or connectivity across networks.

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
