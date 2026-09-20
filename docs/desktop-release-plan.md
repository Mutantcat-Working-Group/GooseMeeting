# Desktop Release Plan

Approved scope: Tauri 2 desktop client, version 1.0.20260920, tag-triggered
GitHub releases with Windows x64 NSIS, macOS Intel and Apple Silicon DMGs,
and Linux x64 AppImage. Bundle frontend assets and retain the separate backend.

## Implementation Checklist

- [x] Add tests for release version mapping and saved backend configuration.
- [x] Add Tauri configuration, media permission declarations, icons and build commands.
- [x] Configure server selection and desktop-safe authentication storage.
- [x] Add a locked dependency graph and CI validation.
- [x] Build four targets on native GitHub runners; sign and verify macOS app/DMG.
- [x] Publish only after all artifacts pass checks, including SHA-256 manifest.
- [x] Update Chinese and English documentation and installation limitations.
- [x] Run local checks, push CI, tag the version and inspect the real release.

## Verified Release: 2026-09-19

- Version/tag: `1.0.20260919` / `v1.0.20260919`, source commit `b06ac46`.
- [Native preflight](https://github.com/Mutantcat-Working-Group/GooseMeeting/actions/runs/35429949452): all four targets passed; publishing skipped as intended.
- [Tag-triggered release](https://github.com/Mutantcat-Working-Group/GooseMeeting/actions/runs/35430643222): validation, all four builds and publication passed.
- [Published release](https://github.com/Mutantcat-Working-Group/GooseMeeting/releases/tag/v1.0.20260919): Windows x64 NSIS EXE, macOS x64/ARM64 DMGs, Linux x64 AppImage and `SHA256SUMS.txt` present.
- Local checks: 75 tests across 14 suites, ESLint, Cargo check/format and macOS production bundle passed. Desktop login layout and server persistence after restart were checked.
- Both macOS jobs verified ad-hoc application signatures, signed the DMGs and verified image checksums. The downloaded ARM64 preflight DMG was also mounted and its application signature and architecture verified locally.
- No live meeting backend was available for end-to-end calls. Windows/Linux installer launch, actual media capture and screen sharing across operating systems remain real-device test coverage gaps. Ad-hoc signing is not Apple notarization.
- GitHub emitted action-runtime deprecation notices for v4 actions, automatically using Node 24; these were warnings, not build failures.

## Version Policy

The public version is read from package.json. Windows native numeric fields
cannot contain an eight-digit patch. For Windows packaging, map YYYYMMDD to
YYYY plus MMDD build metadata (1.0.2026+920 for 1.0.20260920); retain the public version in the
application UI, Git tag, release title and downloadable artifact filenames.
Reject invalid dates and mismatched tags before uploading any artifacts.

## Verification

Run Jest, ESLint, frontend production build, Cargo checks and a local macOS
bundle. CI verifies native artifacts and macOS ad-hoc signatures, then checks
that exactly four installers exist before publishing. Inspect GitHub run and
release API results after dispatch. Test desktop launch locally; do not claim
multi-device backend calls or every distribution's installation is tested.

## Security and Distribution

Only the bundled main window receives minimal Tauri capabilities. No shell or
filesystem commands are exposed to frontend content. Backend endpoints must
be HTTP(S), with no credentials, query or fragment, and changing servers
clears authentication. Windows ships the offline WebView2 installer. macOS
ad-hoc signing is not notarization; Gatekeeper can require user approval.
AppImage may require executable permission and FUSE on the user's system.
