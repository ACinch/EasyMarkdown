import {
  initTabs,
  createTab,
  getActiveTab,
  getAllTabs,
  updateTabContent,
  markTabSaved,
  findTabByPath,
  closeTab,
  closeAllTabs,
  hasTabs,
  setActiveTab,
  getActiveTabIndex,
  Tab,
} from "./tabs";
import { initEditor, setContent, getContent, focus, getCursorPosition, setSpellcheck, getEditorView } from "./editor";
import { initCommandBar, applyFormat, FormatType } from "./commandbar";
import { initImageDialog } from "./imagedialog";
import { initTableDialog } from "./tabledialog";
import {
  initWysiwyg,
  createEditor,
  setContent as setWysiwygContent,
  getContent as getWysiwygContent,
  focus as focusWysiwyg,
  destroyEditor,
} from "./wysiwyg";
import { initSettingsDialog, showSettingsDialog, Settings, THEME_COLORS } from "./settingsdialog";
import {
  initStatusBar,
  showStatusBar,
  hideStatusBar,
  updateWordCount,
  updateCursorPosition,
} from "./statusbar";
import { initFindReplace, showFind, showReplace } from "./findreplace";
import { initOutline, toggleOutline, updateOutline } from "./outline";
import { exportToHtml, exportToPdf } from "./export";

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
      onTabCloseAll: (callback: () => void) => void;
      onFormatApply: (callback: (format: string) => void) => void;
      onViewToggle: (callback: () => void) => void;
      onViewSplit: (callback: () => void) => void;
      onOutlineToggle: (callback: () => void) => void;
      onFocusModeToggle: (callback: () => void) => void;
      onViewSettings: (callback: () => void) => void;
      onEditFind: (callback: () => void) => void;
      onEditReplace: (callback: () => void) => void;
      onExportHtml: (callback: () => void) => void;
      onExportPdf: (callback: () => void) => void;
      showExportDialog: (format: string, defaultName: string) => Promise<{
        success: boolean;
        filePath?: string;
        canceled?: boolean;
        error?: string;
      }>;
      exportFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      exportToPdf: (filePath: string, html: string) => Promise<{ success: boolean; error?: string }>;
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<{ success: boolean; error?: string }>;
      resetSettings: () => Promise<{ success: boolean; settings?: Settings; error?: string }>;
      getSession: () => Promise<Session>;
      saveSession: (session: Session) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

interface SessionTab {
  filePath: string;
  scrollPosition?: number;
}

interface Session {
  tabs: SessionTab[];
  activeTabIndex: number;
}

type ViewMode = "raw" | "preview" | "split";
let viewMode: ViewMode = "raw";
let focusMode: boolean = false;
let currentSettings: Settings | null = null;
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;

// DOM Elements
let editorContainer: HTMLElement;
let previewContainer: HTMLElement;
let emptyState: HTMLElement;
let viewModeLabel: HTMLElement;
let editor: HTMLTextAreaElement;
let splitResizeHandle: HTMLElement;
let contentEl: HTMLElement;
let splitRatio = 0.5; // Default 50/50 split

function init(): void {
  const isMac = window.electron.platform === "darwin";

  // Get DOM elements
  editorContainer = document.getElementById("editor-container")!;
  previewContainer = document.getElementById("preview-container")!;
  emptyState = document.getElementById("empty-state")!;
  viewModeLabel = document.getElementById("view-mode-label")!;
  editor = document.getElementById("editor") as HTMLTextAreaElement;
  splitResizeHandle = document.getElementById("split-resize-handle")!;
  contentEl = document.getElementById("content")!;

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
  initWysiwyg(preview, handleWysiwygChange);
  initCommandBar(commandBar);
  initImageDialog();
  initTableDialog();
  initSettingsDialog(handleSaveSettings);
  initStatusBar();
  initFindReplace(editor);
  initOutline(scrollToLine);

  // Editor cursor position tracking will be handled via CodeMirror update listener
  // We'll set up a polling interval since CodeMirror doesn't have simple cursor events
  setInterval(() => {
    if (getEditorView()) {
      updateCursorPosition(getCursorPosition());
    }
  }, 100);

  // Set up event listeners
  newTabBtn.addEventListener("click", () => createNewTab());
  toggleViewBtn.addEventListener("click", () => toggleViewMode());

  // Set up IPC listeners
  window.electron.onFileNew(() => createNewTab());
  window.electron.onFileOpenPath((filePath) => openFile(filePath));
  window.electron.onFileSave(() => saveCurrentTab());
  window.electron.onFileSaveAs(() => saveCurrentTabAs());
  window.electron.onTabClose(() => closeCurrentTab());
  window.electron.onTabCloseAll(() => closeAllTabs());
  window.electron.onFormatApply((format) => applyFormat(format as FormatType));
  window.electron.onViewToggle(() => toggleViewMode());
  window.electron.onViewSplit(() => enableSplitView());
  window.electron.onOutlineToggle(() => {
    const tab = getActiveTab();
    toggleOutline(tab?.content || "");
  });
  window.electron.onFocusModeToggle(() => toggleFocusMode());
  window.electron.onViewSettings(() => openSettings());

  // Escape key to exit focus mode
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && focusMode) {
      exitFocusMode();
    }
  });
  window.electron.onEditFind(() => showFind());
  window.electron.onEditReplace(() => showReplace());
  window.electron.onExportHtml(() => exportToHtml());
  window.electron.onExportPdf(() => exportToPdf());

  // Set up drag and drop for files
  setupDragAndDrop();

  // Set up split view resize handle
  setupSplitResize();

  // Load and apply settings
  loadSettings();

  // Restore previous session
  restoreSession();

  // Save session before window closes
  window.addEventListener("beforeunload", () => {
    saveSession();
  });

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

async function restoreSession(): Promise<void> {
  try {
    const session = await window.electron.getSession();
    if (!session.tabs || session.tabs.length === 0) {
      return;
    }

    // Open each file from the session
    for (const sessionTab of session.tabs) {
      if (sessionTab.filePath) {
        await openFile(sessionTab.filePath);
      }
    }

    // Set the active tab if we have tabs and a valid index
    const allTabs = getAllTabs();
    if (allTabs.length > 0 && session.activeTabIndex >= 0 && session.activeTabIndex < allTabs.length) {
      setActiveTab(allTabs[session.activeTabIndex].id);
    }
  } catch (error) {
    console.error("Failed to restore session:", error);
  }
}

async function saveSession(): Promise<void> {
  try {
    const allTabs = getAllTabs();
    const sessionTabs: SessionTab[] = allTabs
      .filter((tab) => tab.filePath !== null)
      .map((tab) => ({
        filePath: tab.filePath!,
        scrollPosition: 0, // TODO: Track scroll position per tab
      }));

    const session: Session = {
      tabs: sessionTabs,
      activeTabIndex: getActiveTabIndex(),
    };

    await window.electron.saveSession(session);
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

// Helper to resolve theme color value from preset
function resolveThemeColor(
  setting: { preset: "light" | "dark" | "custom"; custom: string },
  colorKey: keyof typeof THEME_COLORS
): string {
  if (setting.preset === "custom") {
    return setting.custom;
  }
  return THEME_COLORS[colorKey][setting.preset];
}

function applySettings(settings: Settings): void {
  const root = document.documentElement;

  // Apply font size directly to root element for rem calculations
  root.style.fontSize = `${settings.fontSize}px`;

  // Apply font family as CSS custom property
  root.style.setProperty("--editor-font-family", settings.fontFamily);

  // Apply theme colors
  const fgColor = resolveThemeColor(settings.theme.foreground, "foreground");
  const bgColor = resolveThemeColor(settings.theme.background, "background");
  const headingColor = resolveThemeColor(settings.theme.heading, "heading");
  const tableHeaderBg = resolveThemeColor(settings.theme.tableHeader, "tableHeader");

  root.style.setProperty("--editor-fg-color", fgColor);
  root.style.setProperty("--editor-bg-color", bgColor);
  root.style.setProperty("--editor-heading-color", headingColor);
  root.style.setProperty("--editor-table-header-bg", tableHeaderBg);

  // Update CodeMirror theme
  import("./editor").then(({ updateTheme }) => {
    updateTheme({
      foreground: fgColor,
      background: bgColor,
      heading: headingColor,
    });
  });

  // Set up auto-save timer
  setupAutoSave(settings);

  // Apply spell check
  setSpellcheck(settings.spellCheck);
}

function setupAutoSave(settings: Settings): void {
  // Clear existing timer
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }

  // Set up new timer if auto-save is enabled
  if (settings.autoSave) {
    autoSaveTimer = setInterval(() => {
      autoSaveAllDirtyTabs();
    }, settings.autoSaveInterval * 1000);
  }
}

async function autoSaveAllDirtyTabs(): Promise<void> {
  const allTabs = getAllTabs();
  for (const tab of allTabs) {
    // Only auto-save dirty tabs that have a file path (not new untitled files)
    if (tab.isDirty && tab.filePath) {
      const result = await window.electron.saveFile(tab.filePath, tab.content);
      if (result.success) {
        markTabSaved(tab.id);
      }
    }
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

function setupSplitResize(): void {
  let isResizing = false;
  let startX = 0;
  let startEditorWidth = 0;
  let startPreviewWidth = 0;

  splitResizeHandle.addEventListener("mousedown", (e) => {
    if (viewMode !== "split") return;
    isResizing = true;
    startX = e.clientX;
    startEditorWidth = editorContainer.offsetWidth;
    startPreviewWidth = previewContainer.offsetWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const delta = e.clientX - startX;
    const totalWidth = startEditorWidth + startPreviewWidth;

    // Calculate new widths based on drag delta
    let newEditorWidth = startEditorWidth + delta;
    let newPreviewWidth = startPreviewWidth - delta;

    // Constrain to 20%-80% range
    const minWidth = totalWidth * 0.2;
    const maxWidth = totalWidth * 0.8;

    if (newEditorWidth < minWidth) {
      newEditorWidth = minWidth;
      newPreviewWidth = totalWidth - minWidth;
    } else if (newEditorWidth > maxWidth) {
      newEditorWidth = maxWidth;
      newPreviewWidth = totalWidth - maxWidth;
    }

    editorContainer.style.width = `${newEditorWidth}px`;
    previewContainer.style.width = `${newPreviewWidth}px`;

    // Update split ratio for persistence
    splitRatio = newEditorWidth / totalWidth;
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });
}

function applySplitRatio(): void {
  if (viewMode !== "split") return;

  // Get available width from content area minus outline and resize handle
  const outlinePanel = document.getElementById("outline-panel");
  const outlineWidth = outlinePanel && !outlinePanel.classList.contains("hidden")
    ? outlinePanel.offsetWidth
    : 0;

  const handleWidth = 4;
  const availableWidth = contentEl.offsetWidth - outlineWidth - handleWidth;

  const editorWidth = Math.floor(availableWidth * splitRatio);
  const previewWidth = availableWidth - editorWidth;

  editorContainer.style.flex = "none";
  previewContainer.style.flex = "none";
  editorContainer.style.width = `${editorWidth}px`;
  previewContainer.style.width = `${previewWidth}px`;
}

function handleTabChange(tab: Tab | null): void {
  if (tab) {
    setContent(tab.content);
    // Update WYSIWYG content in both preview and split modes
    if (viewMode === "preview" || viewMode === "split") {
      setWysiwygContent(tab.content);
    }
    updateOutline(tab.content);
    focus();
  } else {
    setContent("");
    destroyEditor();
    updateOutline("");
  }
  updateUI();
  // Save session when switching tabs to preserve active tab index
  saveSession();
}

function handleTabsUpdate(_tabs: Tab[]): void {
  updateUI();
  // Save session whenever tabs change (open, close, or save)
  saveSession();
}

function handleContentChange(content: string): void {
  const tab = getActiveTab();
  if (tab) {
    updateTabContent(tab.id, content);
    updateWordCount(content);
    updateOutline(content);
  }
}

function scrollToLine(line: number): void {
  const editorView = getEditorView();
  if (!editorView) return;

  // Get the position at the start of the line
  const lineInfo = editorView.state.doc.line(Math.min(line, editorView.state.doc.lines));
  const pos = lineInfo.from;

  // Set cursor and scroll into view
  editorView.dispatch({
    selection: { anchor: pos },
    scrollIntoView: true,
  });
  editorView.focus();
}

function handleWysiwygChange(content: string): void {
  const tab = getActiveTab();
  if (tab) {
    updateTabContent(tab.id, content);
    updateWordCount(content);
    updateOutline(content);
    // Also update the raw editor so it stays in sync
    setContent(content);
  }
}

function updateUI(): void {
  const hasOpenTabs = hasTabs();

  if (hasOpenTabs) {
    emptyState.classList.add("hidden");
    showStatusBar();

    // Update word count for current tab
    const tab = getActiveTab();
    if (tab) {
      updateWordCount(tab.content);
    }

    if (viewMode === "raw") {
      editorContainer.classList.remove("hidden");
      previewContainer.classList.add("hidden");
      splitResizeHandle.classList.add("hidden");
      contentEl.classList.remove("split-view");
      // Reset to flex layout
      editorContainer.style.width = "";
      editorContainer.style.flex = "1";
      previewContainer.style.width = "";
      previewContainer.style.flex = "";
      viewModeLabel.textContent = "Split View";
    } else if (viewMode === "preview") {
      editorContainer.classList.add("hidden");
      previewContainer.classList.remove("hidden");
      splitResizeHandle.classList.add("hidden");
      contentEl.classList.remove("split-view");
      // Reset to flex layout - preview takes full width
      editorContainer.style.width = "";
      editorContainer.style.flex = "";
      previewContainer.style.width = "";
      previewContainer.style.flex = "1";
      viewModeLabel.textContent = "Edit";
    } else {
      // Split view
      editorContainer.classList.remove("hidden");
      previewContainer.classList.remove("hidden");
      splitResizeHandle.classList.remove("hidden");
      contentEl.classList.add("split-view");
      viewModeLabel.textContent = "Preview";
      // Apply saved split ratio after a brief delay to let layout settle
      requestAnimationFrame(() => applySplitRatio());
    }
  } else {
    emptyState.classList.remove("hidden");
    editorContainer.classList.add("hidden");
    previewContainer.classList.add("hidden");
    splitResizeHandle.classList.add("hidden");
    contentEl.classList.remove("split-view");
    editorContainer.style.width = "";
    editorContainer.style.flex = "";
    previewContainer.style.width = "";
    previewContainer.style.flex = "";
    hideStatusBar();
  }
}

function toggleFocusMode(): void {
  if (!hasTabs()) return;

  focusMode = !focusMode;
  const body = document.body;

  if (focusMode) {
    body.classList.add("focus-mode");
  } else {
    body.classList.remove("focus-mode");
  }
}

function exitFocusMode(): void {
  if (focusMode) {
    focusMode = false;
    document.body.classList.remove("focus-mode");
  }
}

async function toggleViewMode(): Promise<void> {
  if (!hasTabs()) return;

  const tab = getActiveTab();

  if (viewMode === "raw") {
    // Switching from raw to split
    viewMode = "split";
    if (tab) {
      await createEditor(tab.content);
    }
  } else if (viewMode === "split") {
    // Switching from split to preview only
    viewMode = "preview";
    focusWysiwyg();
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

async function enableSplitView(): Promise<void> {
  if (!hasTabs()) return;

  // If already in split, do nothing
  if (viewMode === "split") return;

  const tab = getActiveTab();

  // If in raw mode, switch to split
  if (viewMode === "raw") {
    viewMode = "split";
    if (tab) {
      await createEditor(tab.content);
    }
  } else if (viewMode === "preview") {
    // If in preview mode, switch to split
    viewMode = "split";
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
