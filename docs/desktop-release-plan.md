# Desktop Release Plan

Approved scope: Tauri 2 desktop client, version 1.0.20260919, tag-triggered
GitHub releases with Windows x64 NSIS, macOS Intel and Apple Silicon DMGs,
and Linux x64 AppImage. Bundle frontend assets and retain the separate backend.

## Implementation Checklist

- [ ] Add tests for release version mapping and saved backend configuration.
- [ ] Add Tauri configuration, media permission declarations, icons and commands.
- [ ] Configure server selection and desktop-safe authentication storage.
- [ ] Add a locked dependency graph and CI validation.
- [ ] Build four targets on native GitHub runners; sign and verify macOS app/DMG.
- [ ] Publish only after all artifacts pass checks, including SHA-256 manifest.
- [ ] Update Chinese and English documentation and installation limitations.
- [ ] Run local checks, push CI, tag the version and inspect the real release.

## Version Policy

The public version is read from package.json. Windows native numeric fields
cannot contain an eight-digit patch. For Windows packaging, map YYYYMMDD to
YYYY plus MMDD build metadata (1.0.2026+919); retain the public version in the
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
