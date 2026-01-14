import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { buildMenu, refreshMenu } from "./menu";
import { store } from "./store";
import { initAutoUpdater, checkForUpdatesOnStartup } from "./updater";

let mainWindow: BrowserWindow | null = null;

const isMac = process.platform === "darwin";

// Set app name for development mode
if (app.name === "Electron" || app.name === "electron") {
  app.name = "EasyMarkdown";
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: isMac ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Set up application menu
  const menu = buildMenu(mainWindow);
  const { Menu } = require("electron");
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle("file:read", async (_, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    store.addRecentFile(filePath);
    refreshMenu(mainWindow);
    return { success: true, content, filePath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle(
  "file:save",
  async (_, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, "utf-8");
      store.addRecentFile(filePath);
      refreshMenu(mainWindow);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle("file:save-dialog", async (_, defaultPath?: string) => {
  if (!mainWindow) return { success: false, error: "No window" };

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath || "untitled.md",
    filters: [
      { name: "Markdown", extensions: ["md"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  return { success: true, filePath: result.filePath };
});

ipcMain.handle("file:open-dialog", async () => {
  if (!mainWindow) return { success: false, error: "No window" };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Markdown", extensions: ["md", "markdown"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  return { success: true, filePath: result.filePaths[0] };
});

ipcMain.handle("file:open-image-dialog", async () => {
  if (!mainWindow) return { success: false, error: "No window" };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  return { success: true, filePath: result.filePaths[0] };
});

ipcMain.handle("recent:get", () => {
  return store.getRecentFiles();
});

ipcMain.handle("settings:get", () => {
  return store.getSettings();
});

ipcMain.handle("settings:save", (_, settings) => {
  try {
    store.setSettings(settings);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("settings:reset", () => {
  try {
    store.resetSettings();
    return { success: true, settings: store.getSettings() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("session:get", () => {
  return store.getSession();
});

ipcMain.handle("session:save", (_, session) => {
  try {
    store.setSession(session);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle(
  "dialog:confirm",
  async (_, message: string, detail?: string) => {
    if (!mainWindow) return false;

    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: ["Don't Save", "Cancel", "Save"],
      defaultId: 2,
      message,
      detail,
    });

    // 0 = Don't Save, 1 = Cancel, 2 = Save
    return result.response;
  }
);

// Export handlers
ipcMain.handle("export:dialog", async (_, format: string, defaultName: string) => {
  if (!mainWindow) return { success: false, error: "No window" };

  const filters = format === "pdf"
    ? [{ name: "PDF", extensions: ["pdf"] }]
    : [{ name: "HTML", extensions: ["html", "htm"] }];

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters,
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  return { success: true, filePath: result.filePath };
});

ipcMain.handle("export:file", async (_, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("export:pdf", async (_, filePath: string, html: string) => {
  if (!mainWindow) return { success: false, error: "No window" };

  try {
    // Create a hidden window to render HTML
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load the HTML content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF
    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5,
      },
    });

    // Write PDF to file
    fs.writeFileSync(filePath, pdfBuffer);

    // Close the print window
    printWindow.close();

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // Initialize auto-updater
  initAutoUpdater();
  checkForUpdatesOnStartup();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle file open from Finder (macOS)
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send("file:open-path", filePath);
  } else {
    app.whenReady().then(() => {
      if (mainWindow) {
        mainWindow.webContents.send("file:open-path", filePath);
      }
    });
  }
});
