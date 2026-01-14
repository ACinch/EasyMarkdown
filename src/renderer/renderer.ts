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
import { initCommandBar, applyFormat, FormatType } from "./commandbar";
import { initImageDialog } from "./imagedialog";
import {
  initWysiwyg,
  createEditor,
  setContent as setWysiwygContent,
  getContent as getWysiwygContent,
  focus as focusWysiwyg,
  destroyEditor,
} from "./wysiwyg";
import { initSettingsDialog, showSettingsDialog, Settings } from "./settingsdialog";

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
      onDarkModeToggle: (callback: () => void) => void;
      onViewSettings: (callback: () => void) => void;
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<{ success: boolean; error?: string }>;
      resetSettings: () => Promise<{ success: boolean; settings?: Settings; error?: string }>;
    };
  }
}

type ViewMode = "raw" | "preview";
let viewMode: ViewMode = "raw";
let darkMode: boolean = false;
let currentSettings: Settings | null = null;

// DOM Elements
let editorContainer: HTMLElement;
let previewContainer: HTMLElement;
let emptyState: HTMLElement;
let viewModeLabel: HTMLElement;
let editor: HTMLTextAreaElement;
let darkModeBtn: HTMLElement;

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
  darkModeBtn = document.getElementById("toggle-dark-mode-btn")!;

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
  initWysiwyg(preview, handleWysiwygChange);
  initCommandBar(commandBar);
  initImageDialog();
  initSettingsDialog(handleSaveSettings);

  // Set up event listeners
  newTabBtn.addEventListener("click", () => createNewTab());
  toggleViewBtn.addEventListener("click", () => toggleViewMode());
  darkModeBtn.addEventListener("click", () => toggleDarkMode());

  // Set up IPC listeners
  window.electron.onFileNew(() => createNewTab());
  window.electron.onFileOpenPath((filePath) => openFile(filePath));
  window.electron.onFileSave(() => saveCurrentTab());
  window.electron.onFileSaveAs(() => saveCurrentTabAs());
  window.electron.onTabClose(() => closeCurrentTab());
  window.electron.onFormatApply((format) => applyFormat(format as FormatType));
  window.electron.onViewToggle(() => toggleViewMode());
  window.electron.onDarkModeToggle(() => toggleDarkMode());
  window.electron.onViewSettings(() => openSettings());

  // Set up drag and drop for files
  setupDragAndDrop();

  // Initialize dark mode based on system preference
  initDarkMode();

  // Load and apply settings
  loadSettings();

  // Show empty state initially
  updateUI();
}

async function loadSettings(): Promise<void> {
  try {
    const settings = await window.electron.getSettings();
    currentSettings = settings;
    applySettings(settings);
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

function applySettings(settings: Settings): void {
  const root = document.documentElement;

  // Apply font size directly to root element for rem calculations
  root.style.fontSize = `${settings.fontSize}px`;

  // Apply font family as CSS custom property
  root.style.setProperty("--editor-font-family", settings.fontFamily);

  // Apply foreground color
  if (settings.foregroundColor === "default") {
    root.style.removeProperty("--editor-fg-color");
  } else {
    root.style.setProperty("--editor-fg-color", settings.foregroundColor);
  }

  // Apply background color
  if (settings.backgroundColor === "default") {
    root.style.removeProperty("--editor-bg-color");
  } else {
    root.style.setProperty("--editor-bg-color", settings.backgroundColor);
  }
}

function openSettings(): void {
  if (currentSettings) {
    showSettingsDialog(currentSettings);
  }
}

async function handleSaveSettings(settings: Settings): Promise<void> {
  try {
    const result = await window.electron.saveSettings(settings);
    if (result.success) {
      currentSettings = settings;
      applySettings(settings);
    }
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

function initDarkMode(): void {
  // Check system preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (prefersDark) {
    darkMode = true;
    previewContainer.classList.add("dark-mode");
    darkModeBtn.classList.add("dark-mode-active");
  }

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (e.matches !== darkMode) {
      toggleDarkMode();
    }
  });
}

function setupDragAndDrop(): void {
  // Prevent default drag behavior
  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Handle file drop
  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Filter and open markdown files
    for (const file of Array.from(files)) {
      const filePath = (file as any).path as string;
      if (filePath && isMarkdownFile(filePath)) {
        await openFile(filePath);
      }
    }
  });
}

function isMarkdownFile(filePath: string): boolean {
  const ext = filePath.toLowerCase().split(".").pop();
  return ext === "md" || ext === "markdown" || ext === "mdown" || ext === "mkd";
}

function handleTabChange(tab: Tab | null): void {
  if (tab) {
    setContent(tab.content);
    if (viewMode === "preview") {
      setWysiwygContent(tab.content);
    }
    focus();
  } else {
    setContent("");
    destroyEditor();
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
  }
}

function handleWysiwygChange(content: string): void {
  const tab = getActiveTab();
  if (tab) {
    updateTabContent(tab.id, content);
    // Also update the raw editor so it stays in sync
    setContent(content);
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

function toggleDarkMode(): void {
  darkMode = !darkMode;

  if (darkMode) {
    previewContainer.classList.add("dark-mode");
    darkModeBtn.classList.add("dark-mode-active");
  } else {
    previewContainer.classList.remove("dark-mode");
    darkModeBtn.classList.remove("dark-mode-active");
  }
}

async function toggleViewMode(): Promise<void> {
  if (!hasTabs()) return;

  const tab = getActiveTab();

  if (viewMode === "raw") {
    // Switching from raw to preview
    viewMode = "preview";
    if (tab) {
      await createEditor(tab.content);
      focusWysiwyg();
    }
  } else {
    // Switching from preview to raw
    // Get content from WYSIWYG before destroying
    if (tab) {
      const wysiwygContent = getWysiwygContent();
      updateTabContent(tab.id, wysiwygContent);
      setContent(wysiwygContent);
    }
    viewMode = "raw";
    await destroyEditor();
    focus();
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
    // Handle both Unix (/) and Windows (\) path separators
    const fileName = filePath.split(/[/\\]/).pop() || "Untitled";
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
