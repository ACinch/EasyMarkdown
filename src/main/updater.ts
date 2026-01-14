import { autoUpdater } from "electron-updater";
import { dialog, BrowserWindow } from "electron";

let updateCheckInProgress = false;
let manualCheck = false;

export function initAutoUpdater(): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Event: Update available
  autoUpdater.on("update-available", async (info) => {
    const result = await dialog.showMessageBox({
      type: "info",
      title: "Update Available",
      message: `A new version (${info.version}) is available.`,
      detail: "Would you like to download and install it now?",
      buttons: ["Download", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
    updateCheckInProgress = false;
  });

  // Event: No update available
  autoUpdater.on("update-not-available", () => {
    if (manualCheck) {
      dialog.showMessageBox({
        type: "info",
        title: "No Updates",
        message: "You're running the latest version.",
        buttons: ["OK"],
      });
    }
    updateCheckInProgress = false;
    manualCheck = false;
  });

  // Event: Download progress
  autoUpdater.on("download-progress", (progress) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow) {
      mainWindow.setProgressBar(progress.percent / 100);
    }
  });

  // Event: Update downloaded
  autoUpdater.on("update-downloaded", async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow) {
      mainWindow.setProgressBar(-1); // Remove progress bar
    }

    const result = await dialog.showMessageBox({
      type: "info",
      title: "Update Ready",
      message: "Update downloaded successfully.",
      detail: "The update will be installed when you quit the app. Would you like to restart now?",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // Event: Error
  autoUpdater.on("error", (error) => {
    updateCheckInProgress = false;
    manualCheck = false;

    if (manualCheck) {
      dialog.showMessageBox({
        type: "error",
        title: "Update Error",
        message: "Failed to check for updates.",
        detail: error.message,
        buttons: ["OK"],
      });
    }
    console.error("Auto-updater error:", error);
  });
}

export function checkForUpdates(isManual: boolean = false): void {
  if (updateCheckInProgress) return;

  updateCheckInProgress = true;
  manualCheck = isManual;
  autoUpdater.checkForUpdates();
}

export function checkForUpdatesOnStartup(): void {
  // Check for updates silently on startup (after a short delay)
  setTimeout(() => {
    checkForUpdates(false);
  }, 3000);
}
