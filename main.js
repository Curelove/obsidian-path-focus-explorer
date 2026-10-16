const {
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  Notice
} = require("obsidian");

const DEFAULT_SETTINGS = {
  enabled: false,
  keepDirectlyLinkedNotesVisible: true,
  expandRelatedFolders: true
};

class PathFocusExplorerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("保留直接关联的笔记")
      .setDesc("当前笔记直接链接到的笔记，以及直接反向链接到当前笔记的笔记，将不会被淡化。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.keepDirectlyLinkedNotesVisible)
          .onChange(async (value) => {
            this.plugin.settings.keepDirectlyLinkedNotesVisible = value;
            await this.plugin.saveSettings();
            this.plugin.refreshCurrentFocus();
          })
      );

    new Setting(containerEl)
      .setName("自动展开关联笔记所在文件夹")
      .setDesc("开启聚焦模式时，自动展开当前笔记和直接关联笔记所在的文件夹。")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.expandRelatedFolders)
          .onChange(async (value) => {
            this.plugin.settings.expandRelatedFolders = value;
            await this.plugin.saveSettings();

            if (value && this.plugin.settings.enabled) {
              this.plugin.updateFocus(true);
            }
          })
      );
  }
}

module.exports = class PathFocusExplorerPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );

    this.observers = [];
    this.scrollListeners = [];
    this.pendingTimers = [];
    this.refreshTimer = null;
    this.focusVersion = 0;

    this.addSettingTab(new PathFocusExplorerSettingTab(this.app, this));

    this.ribbonIcon = this.addRibbonIcon(
      "crosshair",
      "切换当前笔记路径聚焦",
      async () => {
        await this.toggleFocus();
      }
    );

    this.addCommand({
      id: "toggle-path-focus",
      name: "切换当前笔记路径聚焦",
      callback: async () => {
        await this.toggleFocus();
      }
    });

    this.addCommand({
      id: "reveal-and-emphasize-active-note",
      name: "定位并强调当前笔记",
      callback: () => {
        this.updateFocus(true);
      }
    });

    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        if (this.settings.enabled) {
          this.updateFocus(true);
        }
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        if (this.settings.enabled) {
          this.refreshCurrentFocus();
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        if (this.settings.enabled) {
          this.installExplorerWatchers();
          this.refreshCurrentFocus();
        }
      })
    );

    if (this.settings.enabled) {
      this.enableFocus();
    } else {
      this.updateRibbonState();
    }
  }

  onunload() {
    this.disableFocus(false);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateRibbonState();
  }

  async toggleFocus() {
    this.settings.enabled = !this.settings.enabled;
    await this.saveSettings();

    if (this.settings.enabled) {
      this.enableFocus();
      new Notice("已开启当前笔记路径聚焦");
    } else {
      this.disableFocus(true);
      new Notice("已关闭当前笔记路径聚焦");
    }
  }

  enableFocus() {
    document.body.addClass("path-focus-explorer-enabled");
    this.updateRibbonState();
    this.installExplorerWatchers();
    this.updateFocus(true);
  }

  disableFocus(updateRibbon) {
    this.focusVersion += 1;
    this.clearPendingTimers();
    this.clearExplorerClasses();
    this.disconnectExplorerWatchers();
    document.body.removeClass("path-focus-explorer-enabled");

    if (updateRibbon) {
      this.updateRibbonState();
    }
  }

  updateRibbonState() {
    if (!this.ribbonIcon) {
      return;
    }

    this.ribbonIcon.toggleClass(
      "path-focus-explorer-ribbon-active",
      this.settings.enabled
    );

    this.ribbonIcon.setAttribute(
      "aria-label",
      this.settings.enabled
        ? "关闭当前笔记路径聚焦"
        : "开启当前笔记路径聚焦"
    );
  }

  clearPendingTimers() {
    window.clearTimeout(this.refreshTimer);
    this.refreshTimer = null;

    this.pendingTimers.forEach((timer) => {
      window.clearTimeout(timer);
    });

    this.pendingTimers = [];
  }

  scheduleTimer(callback, delay) {
    const timer = window.setTimeout(() => {
      this.pendingTimers = this.pendingTimers.filter(
        (pendingTimer) => pendingTimer !== timer
      );
      callback();
    }, delay);

    this.pendingTimers.push(timer);
    return timer;
  }

  installExplorerWatchers() {
    this.disconnectExplorerWatchers();

    const explorers = document.querySelectorAll(
      '.workspace-leaf-content[data-type="file-explorer"]'
    );

    explorers.forEach((explorer) => {
      const observer = new MutationObserver(() => {
        this.scheduleDecorate();
      });

      observer.observe(explorer, {
        childList: true,
        subtree: true
      });

      explorer.addEventListener("scroll", this.handleExplorerScroll, true);

      this.observers.push(observer);
      this.scrollListeners.push(explorer);
    });
  }

  disconnectExplorerWatchers() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    this.scrollListeners.forEach((explorer) => {
      explorer.removeEventListener("scroll", this.handleExplorerScroll, true);
    });

    this.scrollListeners = [];
  }

  handleExplorerScroll = () => {
    this.scheduleDecorate();
  };

  scheduleDecorate() {
    if (!this.settings.enabled) {
      return;
    }

    window.clearTimeout(this.refreshTimer);

    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.decorateExplorer();
    }, 100);
  }

  getActiveFile() {
    const file = this.app.workspace.getActiveFile();
    return file instanceof TFile ? file : null;
  }

  getRelatedFiles(activeFile) {
    const related = new Set();

    if (!this.settings.keepDirectlyLinkedNotesVisible) {
      return related;
    }

    const resolvedLinks = this.app.metadataCache.resolvedLinks || {};
    const outgoing = resolvedLinks[activeFile.path] || {};

    Object.keys(outgoing).forEach((path) => {
      const file = this.app.vault.getAbstractFileByPath(path);

      if (file instanceof TFile) {
        related.add(file.path);
      }
    });

    const backlinks = this.app.metadataCache.getBacklinksForFile(activeFile);

    if (backlinks && backlinks.data) {
      backlinks.data.forEach((_, sourcePath) => {
        const file = this.app.vault.getAbstractFileByPath(sourcePath);

        if (file instanceof TFile) {
          related.add(file.path);
        }
      });
    }

    related.delete(activeFile.path);
    return related;
  }

  getFocusPaths(activeFile, relatedFiles) {
    const visiblePaths = new Set([activeFile.path]);
    const currentAncestors = new Set();
    const relatedAncestors = new Set();

    const addAncestors = (path, targetSet) => {
      let currentPath = path;

      while (currentPath.includes("/")) {
        currentPath = currentPath.substring(
          0,
          currentPath.lastIndexOf("/")
        );

        visiblePaths.add(currentPath);
        targetSet.add(currentPath);
      }
    };

    addAncestors(activeFile.path, currentAncestors);

    relatedFiles.forEach((relatedPath) => {
      visiblePaths.add(relatedPath);
      addAncestors(relatedPath, relatedAncestors);
    });

    return {
      visiblePaths,
      currentAncestors,
      relatedAncestors
    };
  }

  expandFolder(path) {
    const explorerTitles = document.querySelectorAll(
      '.workspace-leaf-content[data-type="file-explorer"] .nav-folder-title[data-path]'
    );

    explorerTitles.forEach((title) => {
      if (title.getAttribute("data-path") !== path) {
        return;
      }

      const folder = title.closest(".nav-folder");

      if (folder && folder.classList.contains("is-collapsed")) {
        title.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
          })
        );
      }
    });
  }

  expandFocusFolders(activeFile, relatedFiles) {
    const foldersToExpand = new Set();

    const collectFolders = (path) => {
      let currentPath = path;

      while (currentPath.includes("/")) {
        currentPath = currentPath.substring(
          0,
          currentPath.lastIndexOf("/")
        );

        foldersToExpand.add(currentPath);
      }
    };

    collectFolders(activeFile.path);
    relatedFiles.forEach((path) => collectFolders(path));

    Array.from(foldersToExpand)
      .sort((a, b) => a.split("/").length - b.split("/").length)
      .forEach((folderPath) => {
        this.expandFolder(folderPath);
      });
  }

  revealActiveFile(activeFile) {
    const explorerLeaves = this.app.workspace.getLeavesOfType("file-explorer");

    explorerLeaves.forEach((leaf) => {
      try {
        const view = leaf.view;

        if (view && typeof view.revealInFolder === "function") {
          Promise.resolve(view.revealInFolder(activeFile)).catch(() => {});
        }
      } catch (_) {
        // 文件列表内部接口不可用时，仍执行淡化与高亮。
      }
    });
  }

  updateFocus(revealActiveFile) {
    if (!this.settings.enabled) {
      return;
    }

    const activeFile = this.getActiveFile();

    if (!activeFile) {
      this.clearExplorerClasses();
      return;
    }

    this.focusVersion += 1;
    const currentVersion = this.focusVersion;
    this.clearPendingTimers();

    const relatedFiles = this.getRelatedFiles(activeFile);

    this.clearExplorerClasses();

    if (revealActiveFile) {
      this.revealActiveFile(activeFile);
    }

    if (this.settings.expandRelatedFolders) {
      this.scheduleTimer(() => {
        if (
          this.settings.enabled &&
          currentVersion === this.focusVersion
        ) {
          this.expandFocusFolders(activeFile, relatedFiles);
        }
      }, 120);
    }

    this.scheduleTimer(() => {
      if (
        this.settings.enabled &&
        currentVersion === this.focusVersion
      ) {
        this.decorateExplorer();
      }
    }, 280);

    this.scheduleTimer(() => {
      if (
        this.settings.enabled &&
        currentVersion === this.focusVersion
      ) {
        this.decorateExplorer();
        this.flashCurrentFile(activeFile.path);
      }
    }, 520);
  }

  refreshCurrentFocus() {
    if (!this.settings.enabled) {
      return;
    }

    this.decorateExplorer();
  }

  decorateExplorer() {
    if (!this.settings.enabled) {
      return;
    }

    const activeFile = this.getActiveFile();

    if (!activeFile) {
      this.clearExplorerClasses();
      return;
    }

    const relatedFiles = this.getRelatedFiles(activeFile);
    const {
      visiblePaths,
      currentAncestors,
      relatedAncestors
    } = this.getFocusPaths(activeFile, relatedFiles);

    const explorers = document.querySelectorAll(
      '.workspace-leaf-content[data-type="file-explorer"]'
    );

    explorers.forEach((explorer) => {
      const allOldItems = explorer.querySelectorAll(
        ".path-focus-explorer-muted, " +
        ".path-focus-explorer-current, " +
        ".path-focus-explorer-current-ancestor, " +
        ".path-focus-explorer-related, " +
        ".path-focus-explorer-related-ancestor, " +
        ".path-focus-explorer-flash"
      );

      allOldItems.forEach((item) => {
        item.removeClass(
          "path-focus-explorer-muted",
          "path-focus-explorer-current",
          "path-focus-explorer-current-ancestor",
          "path-focus-explorer-related",
          "path-focus-explorer-related-ancestor",
          "path-focus-explorer-flash"
        );
      });

      const items = explorer.querySelectorAll(
        ".nav-file-title[data-path], .nav-folder-title[data-path]"
      );

      items.forEach((item) => {
        const path = item.getAttribute("data-path");

        if (!path) {
          return;
        }

        if (!visiblePaths.has(path)) {
          item.addClass("path-focus-explorer-muted");
          return;
        }

        if (path === activeFile.path) {
          item.addClass("path-focus-explorer-current");
          return;
        }

        if (relatedFiles.has(path)) {
          item.addClass("path-focus-explorer-related");
          return;
        }

        if (currentAncestors.has(path)) {
          item.addClass("path-focus-explorer-current-ancestor");
          return;
        }

        if (relatedAncestors.has(path)) {
          item.addClass("path-focus-explorer-related-ancestor");
        }
      });
    });
  }

  flashCurrentFile(activeFilePath) {
    const explorers = document.querySelectorAll(
      '.workspace-leaf-content[data-type="file-explorer"]'
    );

    explorers.forEach((explorer) => {
      const allFlashingItems = explorer.querySelectorAll(
        ".path-focus-explorer-flash"
      );

      allFlashingItems.forEach((item) => {
        item.removeClass("path-focus-explorer-flash");
      });

      const currentItems = explorer.querySelectorAll(
        `.nav-file-title[data-path]`
      );

      currentItems.forEach((item) => {
        if (item.getAttribute("data-path") !== activeFilePath) {
          return;
        }

        if (!item.classList.contains("path-focus-explorer-current")) {
          return;
        }

        void item.offsetWidth;
        item.addClass("path-focus-explorer-flash");
      });
    });
  }

  clearExplorerClasses() {
    const items = document.querySelectorAll(
      ".path-focus-explorer-muted, " +
      ".path-focus-explorer-current, " +
      ".path-focus-explorer-current-ancestor, " +
      ".path-focus-explorer-related, " +
      ".path-focus-explorer-related-ancestor, " +
      ".path-focus-explorer-flash"
    );

    items.forEach((item) => {
      item.removeClass(
        "path-focus-explorer-muted",
        "path-focus-explorer-current",
        "path-focus-explorer-current-ancestor",
        "path-focus-explorer-related",
        "path-focus-explorer-related-ancestor",
        "path-focus-explorer-flash"
      );
    });
  }
};
