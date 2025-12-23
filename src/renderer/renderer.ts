import {
  initTabs,
  createTab,
  getActiveTab,
  updateTabContent,
  markTabSaved,
  findTabByPath,
  closeTab,
  hasTabs,
  setActiveTab,
  Tab,
} from "./tabs";
import { initEditor, setContent, getContent, focus } from "./editor";
import { initPreview, renderMarkdown, clear as clearPreview } from "./preview";
import { initCommandBar, applyFormat, FormatType } from "./commandbar";
import { initImageDialog } from "./imagedialog";

// Type for electron API
declare global {
  interface Window {
    electron: {
      platform: string;
      readFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        filePath?: string;
        error?: string;
      }>;
      saveFile: (
        filePath: string,
        content: string
      ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      showSaveDialog: (defaultPath?: string) => Promise<{
        success: boolean;
        filePath?: string;
        canceled?: boolean;
      }>;
      showOpenDialog: () => Promise<{
        success: boolean;
        filePath?: string;
        canceled?: boolean;
      }>;
      showOpenImageDialog: () => Promise<{
        success: boolean;
        filePath?: string;
        canceled?: boolean;
      }>;
      getRecentFiles: () => Promise<string[]>;
      showConfirmDialog: (message: string, detail?: string) => Promise<number>;
      onFileNew: (callback: () => void) => void;
      onFileOpenPath: (callback: (filePath: string) => void) => void;
      onFileSave: (callback: () => void) => void;
      onFileSaveAs: (callback: () => void) => void;
      onTabClose: (callback: () => void) => void;
      onFormatApply: (callback: (format: string) => void) => void;
      onViewToggle: (callback: () => void) => void;
    };
  }
}

type ViewMode = "raw" | "preview";
let viewMode: ViewMode = "raw";

// DOM Elements
let editorContainer: HTMLElement;
let previewContainer: HTMLElement;
let emptyState: HTMLElement;
let viewModeLabel: HTMLElement;
let editor: HTMLTextAreaElement;

function init(): void {
  const isMac = window.electron.platform === "darwin";

  // Get DOM elements
  editorContainer = document.getElementById("editor-container")!;
  previewContainer = document.getElementById("preview-container")!;
  emptyState = document.getElementById("empty-state")!;
  viewModeLabel = document.getElementById("view-mode-label")!;
  editor = document.getElementById("editor") as HTMLTextAreaElement;

  const tabsContainer = document.getElementById("tabs")!;
  const commandBar = document.getElementById("command-bar")!;
  const preview = document.getElementById("preview")!;
  const newTabBtn = document.getElementById("new-tab-btn")!;
  const toggleViewBtn = document.getElementById("toggle-view-btn")!;
  const titleBarDragRegion = document.getElementById("title-bar-drag")!;

  // Hide macOS title bar drag region on Windows/Linux
  if (!isMac && titleBarDragRegion) {
    titleBarDragRegion.classList.add("hidden");
  }

  // Update keyboard shortcut hints for non-macOS
  if (!isMac) {
    document.querySelectorAll("kbd").forEach((kbd) => {
      kbd.textContent = kbd.textContent?.replace("Cmd", "Ctrl") || kbd.textContent;
    });
  }

  // Initialize components
  initTabs(tabsContainer, handleTabChange, handleTabsUpdate);
  initEditor(editor, handleContentChange);
  initPreview(preview);
  initCommandBar(commandBar);
  initImageDialog();

  // Set up event listeners
  newTabBtn.addEventListener("click", () => createNewTab());
  toggleViewBtn.addEventListener("click", () => toggleViewMode());

  // Set up IPC listeners
  window.electron.onFileNew(() => createNewTab());
  window.electron.onFileOpenPath((filePath) => openFile(filePath));
  window.electron.onFileSave(() => saveCurrentTab());
  window.electron.onFileSaveAs(() => saveCurrentTabAs());
  window.electron.onTabClose(() => closeCurrentTab());
  window.electron.onFormatApply((format) => applyFormat(format as FormatType));
  window.electron.onViewToggle(() => toggleViewMode());

  // Show empty state initially
  updateUI();
}

function handleTabChange(tab: Tab | null): void {
  if (tab) {
    setContent(tab.content);
    if (viewMode === "preview") {
      renderMarkdown(tab.content);
    }
    focus();
  } else {
    setContent("");
    clearPreview();
  }
  updateUI();
}

function handleTabsUpdate(_tabs: Tab[]): void {
  updateUI();
}

function handleContentChange(content: string): void {
  const tab = getActiveTab();
  if (tab) {
    updateTabContent(tab.id, content);
    if (viewMode === "preview") {
      renderMarkdown(content);
    }
  }
}

function updateUI(): void {
  const hasOpenTabs = hasTabs();

  if (hasOpenTabs) {
    emptyState.classList.add("hidden");
    editorContainer.classList.remove("hidden");

    if (viewMode === "raw") {
      editorContainer.classList.remove("hidden");
      previewContainer.classList.add("hidden");
      viewModeLabel.textContent = "Preview";
    } else {
      editorContainer.classList.add("hidden");
      previewContainer.classList.remove("hidden");
      viewModeLabel.textContent = "Edit";
    }
  } else {
    emptyState.classList.remove("hidden");
    editorContainer.classList.add("hidden");
    previewContainer.classList.add("hidden");
  }
}

function toggleViewMode(): void {
  if (!hasTabs()) return;

  viewMode = viewMode === "raw" ? "preview" : "raw";

  if (viewMode === "preview") {
    const tab = getActiveTab();
    if (tab) {
      renderMarkdown(tab.content);
    }
  }

  updateUI();
}

function createNewTab(): void {
  createTab(null, "Untitled", "");
  focus();
}

async function openFile(filePath: string): Promise<void> {
  // Check if file is already open
  const existingTab = findTabByPath(filePath);
  if (existingTab) {
    setActiveTab(existingTab.id);
    return;
  }

  const result = await window.electron.readFile(filePath);
  if (result.success && result.content !== undefined) {
    const fileName = filePath.split("/").pop() || "Untitled";
    createTab(filePath, fileName, result.content);
  }
}

async function saveCurrentTab(): Promise<boolean> {
  const tab = getActiveTab();
  if (!tab) return false;

  if (tab.filePath) {
    const result = await window.electron.saveFile(tab.filePath, tab.content);
    if (result.success) {
      markTabSaved(tab.id);
      return true;
    }
    return false;
  } else {
    return saveCurrentTabAs();
  }
}

async function saveCurrentTabAs(): Promise<boolean> {
  const tab = getActiveTab();
  if (!tab) return false;

  const dialogResult = await window.electron.showSaveDialog(
    tab.filePath || `${tab.fileName}.md`
  );

  if (dialogResult.canceled || !dialogResult.filePath) {
    return false;
  }

  const saveResult = await window.electron.saveFile(
    dialogResult.filePath,
    tab.content
  );

  if (saveResult.success) {
    const fileName = dialogResult.filePath.split("/").pop() || "Untitled";
    markTabSaved(tab.id, dialogResult.filePath, fileName);
    return true;
  }
  return false;
}

async function closeCurrentTab(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;

  if (tab.isDirty) {
    const result = await window.electron.showConfirmDialog(
      `Do you want to save changes to "${tab.fileName}"?`,
      "Your changes will be lost if you don't save them."
    );

    if (result === 1) {
      // Cancel
      return;
    }

    if (result === 2) {
      // Save
      const saved = await saveCurrentTab();
      if (!saved) return;
    }
    // result === 0: Don't Save - continue closing
  }

  // Mark clean to avoid double confirmation
  if (tab.isDirty) {
    tab.savedContent = tab.content;
    tab.isDirty = false;
  }

  closeTab(tab.id);
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
