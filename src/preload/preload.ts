import { contextBridge, ipcRenderer } from "electron";

export interface FileResult {
  success: boolean;
  content?: string;
  filePath?: string;
  error?: string;
  canceled?: boolean;
}

export interface Settings {
  fontSize: number;
  fontFamily: string;
  foregroundColor: string;
  backgroundColor: string;
}

export interface SettingsResult {
  success: boolean;
  settings?: Settings;
  error?: string;
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

  // Dialogs
  showConfirmDialog: (message: string, detail?: string) => Promise<number>;

  // Event listeners
  onFileNew: (callback: () => void) => void;
  onFileOpenPath: (callback: (filePath: string) => void) => void;
  onFileSave: (callback: () => void) => void;
  onFileSaveAs: (callback: () => void) => void;
  onTabClose: (callback: () => void) => void;
  onFormatApply: (callback: (format: string) => void) => void;
  onViewToggle: (callback: () => void) => void;
  onDarkModeToggle: (callback: () => void) => void;
  onViewSettings: (callback: () => void) => void;

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
  onFormatApply: (callback: (format: string) => void) => {
    ipcRenderer.on("format:apply", (_, format) => callback(format));
  },
  onViewToggle: (callback: () => void) => {
    ipcRenderer.on("view:toggle", callback);
  },
  onDarkModeToggle: (callback: () => void) => {
    ipcRenderer.on("view:toggle-dark", callback);
  },
  onViewSettings: (callback: () => void) => {
    ipcRenderer.on("view:settings", callback);
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
};

contextBridge.exposeInMainWorld("electron", api);
