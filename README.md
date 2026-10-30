# Path Focus Explorer

> **Never lose your place in a massive Obsidian vault again.**  
> **在成百上千篇笔记的大型仓库中，一眼锁定当前笔记所在路径与双链上下文。**

[English](#features) | [中文说明](#中文说明)

<!-- Drag and drop a 5-second GIF showing the File Explorer highlighting the active path and fading unrelated folders -->
![Path Focus Explorer Demo](请在此处拖拽上传切换笔记时左侧文件树自动高亮当前路径与关联双链笔记并淡化无关文件夹的GIF.gif)

---

## Features

When working in a deep folder hierarchy, Obsidian's native File Explorer quickly becomes a wall of text. **Path Focus Explorer** brings spotlight focus to your sidebar:

- **Active Path Spotlight**: Automatically reveals and highlights the currently open note along with every parent folder in its path.
- **Gentle De-Cluttering**: Smoothly fades unrelated files and folders instead of hiding them completely, keeping your spatial orientation intact.
- **Context-Aware Link Visibility**: Optionally keeps **direct outgoing links** and **direct backlinks** fully visible (unfaded) right inside the folder tree—bridging folder hierarchy with bi-directional links.
- **Smart Auto-Expand**: Optionally expands folders containing the active note and its directly related notes while focus mode is active.
- **Smooth & Performant**: Features a subtle visual emphasis animation on locate and maintains styling smoothly while scrolling through large vaults.

---

## Installation

### Option 1: Obsidian Community Plugins

1. Open **Settings -> Community plugins** in Obsidian.
2. Search for **Path Focus Explorer**.
3. Click **Install** and **Enable**.

### Option 2: Using BRAT

1. Install and enable the **BRAT** plugin.
2. Click **Add Beta plugin** and enter:

```text
https://github.com/Curelove/obsidian-path-focus-explorer
```

3. Enable **Path Focus Explorer** in Community plugins.

### Option 3: Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [Latest Release](https://github.com/Curelove/obsidian-path-focus-explorer/releases).
2. Put all three files into the following folder inside your vault:

```text
.obsidian/plugins/path-focus-explorer/
```

3. Reload Obsidian and enable **Path Focus Explorer** in Settings -> Community plugins.

---

## Commands & Settings

### Commands

Toggle or trigger focus anytime via the left ribbon icon or Command Palette (`Ctrl/Cmd + P`):

- `Path Focus Explorer: Toggle current note path focus`
- `Path Focus Explorer: Reveal and emphasize active note`

### Settings

- **Keep directly related notes visible**: Prevents notes directly linked from the active note (and direct backlinks) from being faded out.
- **Automatically expand folders containing related notes**: Automatically unfolds parent folders of the active note and its directly linked notes while path focus is turned on.

---

## 中文说明

当你的 Obsidian 仓库积累了几百上千篇笔记、目录层级越来越深时，左侧原生文件树很容易变成一面令人眼花缭乱的「文字墙」。**Path Focus Explorer（路径聚焦浏览器）** 为你的文件树引入了类似聚光灯的视觉降噪体验：

### 核心亮点

- **整条父级路径高亮**：开启聚焦后，自动在文件树中定位当前打开的笔记，并将它及整条父级文件夹链路高亮显示。
- **柔和淡化无关干扰**：将与当前工作无关的其他文件和目录柔和半透明化（Fade），既消除了视觉噪音，又不会像完全隐藏那样破坏目录位置感。
- **双链关系在目录树中同屏显影**：支持在文件树中同时保持当前笔记的**直接出链（Outgoing links）与直接反链（Backlinks）**高亮可见，并可自动展开它们所在的文件夹——让「树状目录」与「网状双链」第一次在左侧边栏合体。
- **一键开关 & 纯本地运行**：可通过左侧边栏图标或命令面板随时开关；支持桌面端与移动端，零网络请求，绝不触碰或修改任何笔记内容。

---

## Compatibility, Privacy & License

- Requires Obsidian `1.13.0` or later (Desktop & Mobile supported).
- **100% Private**: No network connections, no telemetry, and no external data access.
- Released under the [MIT License](LICENSE).
