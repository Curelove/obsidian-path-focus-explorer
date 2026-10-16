# Path Focus Explorer

Path Focus Explorer helps you stay oriented in large Obsidian vaults by emphasizing the current note's location in the native File Explorer.

When enabled, the plugin reveals the active note, highlights its folder path, and fades unrelated files and folders. Directly linked notes and direct backlinks can remain visible as related context.

## Features

- Toggle path focus from the ribbon icon or the Command Palette.
- Reveal and highlight the currently open note in the File Explorer.
- Emphasize the active note and every parent folder in its path.
- Fade unrelated files and folders instead of hiding them.
- Keep direct outgoing links and direct backlinks visible.
- Optionally expand folders containing the active note and related notes.
- Use a short visual emphasis animation when the active note is located.
- Refresh file-list styling while scrolling in large vaults.

## Commands

- `Path Focus Explorer: Toggle current note path focus`
- `Path Focus Explorer: Reveal and emphasize active note`

## Settings

- **Keep directly related notes visible**: Keeps notes directly linked from the active note and notes that directly link to it from being faded.
- **Automatically expand folders containing related notes**: Expands the folder path for the active note and directly related notes while focus is enabled.

## Installation

### Community plugins

1. Open **Settings** in Obsidian.
2. Open **Community plugins**.
3. Search for `Path Focus Explorer`.
4. Select **Install**, then select **Enable**.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest GitHub release.
2. Create this folder in your vault:

   ```text
   VaultFolder/.obsidian/plugins/path-focus-explorer/
   ```

3. Place all three downloaded files in that folder.
4. Reload Obsidian.
5. Open **Settings > Community plugins** and enable **Path Focus Explorer**.

## Compatibility

- Obsidian 1.13.0 or later.
- Desktop and mobile layouts are supported, although the plugin is primarily designed for the File Explorer interface on desktop.

## Privacy

Path Focus Explorer does not use a network connection, collect telemetry, access files outside the current vault, or send note content to external services.

## License

MIT. See [LICENSE](LICENSE).
