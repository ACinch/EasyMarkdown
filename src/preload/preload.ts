import { contextBridge, ipcRenderer } from "electron";

export interface FileResult {
  success: boolean;
  content?: string;
  filePath?: string;
  error?: string;
  canceled?: boolean;
}

export interface ElectronAPI {
  // File operations
  readFile: (filePath: string) => Promise<FileResult>;
  saveFile: (filePath: string, content: string) => Promise<FileResult>;
  showSaveDialog: (defaultPath?: string) => Promise<FileResult>;
  showOpenDialog: () => Promise<FileResult>;

  // Recent files
  getRecentFiles: () => Promise<string[]>;

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

  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

const api: ElectronAPI = {
  // File operations
  readFile: (filePath: string) => {
    console.log("Preload: readFile called with", filePath);
    return ipcRenderer.invoke("file:read", filePath);
  },
  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("file:save", filePath, content),
  showSaveDialog: (defaultPath?: string) =>
    ipcRenderer.invoke("file:save-dialog", defaultPath),
  showOpenDialog: () => ipcRenderer.invoke("file:open-dialog"),

  // Recent files
  getRecentFiles: () => ipcRenderer.invoke("recent:get"),

  // Dialogs
  showConfirmDialog: (message: string, detail?: string) =>
    ipcRenderer.invoke("dialog:confirm", message, detail),

  // Event listeners
  onFileNew: (callback: () => void) => {
    ipcRenderer.on("file:new", callback);
  },
  onFileOpenPath: (callback: (filePath: string) => void) => {
    console.log("Preload: registering file:open-path listener");
    ipcRenderer.on("file:open-path", (_, filePath) => {
      console.log("Preload: file:open-path received", filePath);
      callback(filePath);
    });
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

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
};

contextBridge.exposeInMainWorld("electron", api);
