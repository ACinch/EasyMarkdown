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

// Type for electron API
declare global {
  interface Window {
    electron: {
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
  console.log("Renderer init starting...");

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

  console.log("DOM elements found:", {
    editorContainer: !!editorContainer,
    editor: !!editor,
    tabsContainer: !!tabsContainer
  });

  // Initialize components
  initTabs(tabsContainer, handleTabChange, handleTabsUpdate);
  initEditor(editor, handleContentChange);
  initPreview(preview);
  initCommandBar(commandBar);

  // Set up event listeners
  newTabBtn.addEventListener("click", () => {
    console.log("New tab button clicked");
    createNewTab();
  });
  toggleViewBtn.addEventListener("click", () => {
    console.log("Toggle view clicked");
    toggleViewMode();
  });

  // Set up IPC listeners
  console.log("Setting up IPC listeners, electron API:", !!window.electron);

  window.electron.onFileNew(() => {
    console.log("IPC: file:new received");
    createNewTab();
  });
  window.electron.onFileOpenPath((filePath) => {
    console.log("IPC: file:open-path received", filePath);
    openFile(filePath);
  });
  window.electron.onFileSave(() => {
    console.log("IPC: file:save received");
    saveCurrentTab();
  });
  window.electron.onFileSaveAs(() => {
    console.log("IPC: file:save-as received");
    saveCurrentTabAs();
  });
  window.electron.onTabClose(() => {
    console.log("IPC: tab:close received");
    closeCurrentTab();
  });
  window.electron.onFormatApply((format) => {
    console.log("IPC: format:apply received", format);
    applyFormat(format as FormatType);
  });
  window.electron.onViewToggle(() => {
    console.log("IPC: view:toggle received");
    toggleViewMode();
  });

  // Show empty state initially
  updateUI();
  console.log("Renderer init complete");
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
  console.log("toggleViewMode called, hasTabs:", hasTabs(), "current mode:", viewMode);
  if (!hasTabs()) return;

  viewMode = viewMode === "raw" ? "preview" : "raw";
  console.log("New viewMode:", viewMode);

  if (viewMode === "preview") {
    const tab = getActiveTab();
    console.log("Preview mode, active tab:", tab?.fileName);
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
  } else {
    console.error("Failed to open file:", result.error);
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
    } else {
      console.error("Failed to save file:", result.error);
      return false;
    }
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
  } else {
    console.error("Failed to save file:", saveResult.error);
    return false;
  }
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

  // Force close without checking dirty state again
  const index = (await import("./tabs")).getAllTabs().findIndex((t) => t.id === tab.id);
  const tabs = (await import("./tabs")).getAllTabs().filter((t) => t.id !== tab.id);

  // Manually handle tab removal to avoid the confirm dialog again
  const tabModule = await import("./tabs");

  // Since we've already handled the dirty check, we need to mark it clean first
  if (tab.isDirty) {
    tab.savedContent = tab.content;
    tab.isDirty = false;
  }

  closeTab(tab.id);
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
