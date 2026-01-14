import { contextBridge, ipcRenderer } from "electron";

export interface FileResult {
  success: boolean;
  content?: string;
  filePath?: string;
  error?: string;
  canceled?: boolean;
}

export type ThemePreset = "light" | "dark" | "custom";

export interface ThemeSettings {
  foreground: { preset: ThemePreset; custom: string };
  background: { preset: ThemePreset; custom: string };
  heading: { preset: ThemePreset; custom: string };
  tableHeader: { preset: ThemePreset; custom: string };
}

export interface Settings {
  fontSize: number;
  fontFamily: string;
  theme: ThemeSettings;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
}

export interface SettingsResult {
  success: boolean;
  settings?: Settings;
  error?: string;
}

export interface SessionTab {
  filePath: string;
  scrollPosition?: number;
}

export interface Session {
  tabs: SessionTab[];
  activeTabIndex: number;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  canceled?: boolean;
}

export interface ElectronAPI {
  // Platform info
  platform: string;

  // File operations
  readFile: (filePath: string) => Promise<FileResult>;
  saveFile: (filePath: string, content: string) => Promise<FileResult>;
  showSaveDialog: (defaultPath?: string) => Promise<FileResult>;
  showOpenDialog: () => Promise<FileResult>;
  showOpenImageDialog: () => Promise<FileResult>;

  // Recent files
  getRecentFiles: () => Promise<string[]>;

  // Settings
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<{ success: boolean; error?: string }>;
  resetSettings: () => Promise<SettingsResult>;

  // Session
  getSession: () => Promise<Session>;
  saveSession: (session: Session) => Promise<{ success: boolean; error?: string }>;

  // Export
  showExportDialog: (format: string, defaultName: string) => Promise<ExportResult>;
  exportFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  exportToPdf: (filePath: string, html: string) => Promise<{ success: boolean; error?: string }>;

  // Dialogs
  showConfirmDialog: (message: string, detail?: string) => Promise<number>;

  // Event listeners
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

  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

const api: ElectronAPI = {
  // Platform info
  platform: process.platform,

  // File operations
  readFile: (filePath: string) => ipcRenderer.invoke("file:read", filePath),
  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("file:save", filePath, content),
  showSaveDialog: (defaultPath?: string) =>
    ipcRenderer.invoke("file:save-dialog", defaultPath),
  showOpenDialog: () => ipcRenderer.invoke("file:open-dialog"),
  showOpenImageDialog: () => ipcRenderer.invoke("file:open-image-dialog"),

  // Recent files
  getRecentFiles: () => ipcRenderer.invoke("recent:get"),

  // Settings
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: Settings) => ipcRenderer.invoke("settings:save", settings),
  resetSettings: () => ipcRenderer.invoke("settings:reset"),

  // Session
  getSession: () => ipcRenderer.invoke("session:get"),
  saveSession: (session: Session) => ipcRenderer.invoke("session:save", session),

  // Export
  showExportDialog: (format: string, defaultName: string) =>
    ipcRenderer.invoke("export:dialog", format, defaultName),
  exportFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("export:file", filePath, content),
  exportToPdf: (filePath: string, html: string) =>
    ipcRenderer.invoke("export:pdf", filePath, html),

  // Dialogs
  showConfirmDialog: (message: string, detail?: string) =>
    ipcRenderer.invoke("dialog:confirm", message, detail),

  // Event listeners
  onFileNew: (callback: () => void) => {
    ipcRenderer.on("file:new", callback);
  },
  onFileOpenPath: (callback: (filePath: string) => void) => {
    ipcRenderer.on("file:open-path", (_, filePath) => callback(filePath));
  },
  onFileSave: (callback: () => void) => {
    ipcRenderer.on("file:save", callback);
  },
  onFileSaveAs: (callback: () => void) => {
    ipcRenderer.on("file:save-as", callback);
  },
  onTabClose: (callback: () => void) => {
    ipcRenderer.on("tab:close", callback);
  },
  onTabCloseAll: (callback: () => void) => {
    ipcRenderer.on("tab:close-all", callback);
  },
  onFormatApply: (callback: (format: string) => void) => {
    ipcRenderer.on("format:apply", (_, format) => callback(format));
  },
  onViewToggle: (callback: () => void) => {
    ipcRenderer.on("view:toggle", callback);
  },
  onViewSplit: (callback: () => void) => {
    ipcRenderer.on("view:split", callback);
  },
  onOutlineToggle: (callback: () => void) => {
    ipcRenderer.on("view:toggle-outline", callback);
  },
  onFocusModeToggle: (callback: () => void) => {
    ipcRenderer.on("view:focus-mode", callback);
  },
  onViewSettings: (callback: () => void) => {
    ipcRenderer.on("view:settings", callback);
  },
  onEditFind: (callback: () => void) => {
    ipcRenderer.on("edit:find", callback);
  },
  onEditReplace: (callback: () => void) => {
    ipcRenderer.on("edit:replace", callback);
  },
  onExportHtml: (callback: () => void) => {
    ipcRenderer.on("export:html", callback);
  },
  onExportPdf: (callback: () => void) => {
    ipcRenderer.on("export:pdf", callback);
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
};

contextBridge.exposeInMainWorld("electron", api);
