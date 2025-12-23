import {
  app,
  Menu,
  MenuItemConstructorOptions,
  BrowserWindow,
  dialog,
} from "electron";
import * as path from "path";
import { store } from "./store";

export function buildMenu(mainWindow: BrowserWindow | null): Menu {
  const recentFiles = store.getRecentFiles();

  const recentFilesSubmenu: MenuItemConstructorOptions[] =
    recentFiles.length > 0
      ? [
          ...recentFiles.map((filePath) => ({
            label: path.basename(filePath),
            click: () => {
              if (mainWindow) {
                mainWindow.webContents.send("file:open-path", filePath);
              }
            },
          })),
          { type: "separator" as const },
          {
            label: "Clear Recent",
            click: () => {
              store.clearRecentFiles();
              Menu.setApplicationMenu(buildMenu(mainWindow));
            },
          },
        ]
      : [{ label: "No Recent Files", enabled: false }];

  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("file:new");
            }
          },
        },
        {
          label: "Open...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            if (!mainWindow) return;
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [
                { name: "Markdown", extensions: ["md", "markdown"] },
                { name: "All Files", extensions: ["*"] },
              ],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send("file:open-path", result.filePaths[0]);
            }
          },
        },
        {
          label: "Open Recent",
          submenu: recentFilesSubmenu,
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("file:save");
            }
          },
        },
        {
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("file:save-as");
            }
          },
        },
        { type: "separator" },
        {
          label: "Close Tab",
          accelerator: "CmdOrCtrl+W",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("tab:close");
            }
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Format",
      submenu: [
        {
          label: "Bold",
          accelerator: "CmdOrCtrl+B",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "bold");
            }
          },
        },
        {
          label: "Italic",
          accelerator: "CmdOrCtrl+I",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "italic");
            }
          },
        },
        { type: "separator" },
        {
          label: "Heading 1",
          accelerator: "CmdOrCtrl+1",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "h1");
            }
          },
        },
        {
          label: "Heading 2",
          accelerator: "CmdOrCtrl+2",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "h2");
            }
          },
        },
        {
          label: "Heading 3",
          accelerator: "CmdOrCtrl+3",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "h3");
            }
          },
        },
        { type: "separator" },
        {
          label: "Code",
          accelerator: "CmdOrCtrl+`",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "code");
            }
          },
        },
        {
          label: "Code Block",
          accelerator: "CmdOrCtrl+Shift+`",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "codeblock");
            }
          },
        },
        { type: "separator" },
        {
          label: "Link",
          accelerator: "CmdOrCtrl+K",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "link");
            }
          },
        },
        {
          label: "Bulleted List",
          accelerator: "CmdOrCtrl+Shift+8",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "ul");
            }
          },
        },
        {
          label: "Numbered List",
          accelerator: "CmdOrCtrl+Shift+7",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "ol");
            }
          },
        },
        {
          label: "Blockquote",
          accelerator: "CmdOrCtrl+Shift+.",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "quote");
            }
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Preview",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("view:toggle");
            }
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

export function refreshMenu(mainWindow: BrowserWindow | null): void {
  Menu.setApplicationMenu(buildMenu(mainWindow));
}
