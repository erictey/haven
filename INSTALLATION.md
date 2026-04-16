# Haven Installation Instructions

Haven is distributed as a Windows installer through GitHub Releases.

## For regular users

1. Download the latest release package from [GitHub Releases](https://github.com/erictey/haven/releases/latest).
2. Run `Haven Setup 0.1.0.exe`.
3. If Windows shows a warning, choose `More info` and then `Run anyway` if you trust the file.
4. Follow the installer prompts.
5. Launch Haven from the Start menu or the desktop shortcut after installation.

## What gets installed

- The Haven desktop app
- A Start menu entry
- An optional desktop shortcut

## After installation

- Your data is stored locally on the device.
- You can export your data from the app settings.
- Autostart and tray behavior can be changed inside the app.

## For developers

If you want to build the installer locally, run:

```bash
npm install
npm run build
```

The installer will be written to the `release` folder.
