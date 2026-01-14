import {
  app,
  Menu,
  MenuItemConstructorOptions,
  BrowserWindow,
  dialog,
} from "electron";
import * as path from "path";
import { store } from "./store";
import { checkForUpdates } from "./updater";

const isMac = process.platform === "darwin";

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
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              {
                label: "Check for Updates...",
                click: () => checkForUpdates(true),
              },
              { type: "separator" as const },
              {
                label: "Settings...",
                accelerator: "CmdOrCtrl+,",
                click: () => {
                  if (mainWindow) {
                    mainWindow.webContents.send("view:settings");
                  }
                },
              },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
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
          label: "Export",
          submenu: [
            {
              label: "Export as HTML...",
              click: () => {
                if (mainWindow) {
                  mainWindow.webContents.send("export:html");
                }
              },
            },
            {
              label: "Export as PDF...",
              accelerator: "CmdOrCtrl+Shift+E",
              click: () => {
                if (mainWindow) {
                  mainWindow.webContents.send("export:pdf");
                }
              },
            },
          ],
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
        {
          label: "Close All Tabs",
          accelerator: "CmdOrCtrl+Shift+W",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("tab:close-all");
            }
          },
        },
        // Add Exit for Windows/Linux
        ...(!isMac
          ? [
              { type: "separator" as const },
              { role: "quit" as const, label: "Exit" },
            ]
          : []),
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
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" as const },
              { role: "delete" as const },
              { role: "selectAll" as const },
            ]
          : [
              { role: "delete" as const },
              { type: "separator" as const },
              { role: "selectAll" as const },
            ]),
        { type: "separator" },
        {
          label: "Find",
          accelerator: "CmdOrCtrl+F",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("edit:find");
            }
          },
        },
        {
          label: "Replace",
          accelerator: "CmdOrCtrl+H",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("edit:replace");
            }
          },
        },
        ...(!isMac
          ? [
              { type: "separator" as const },
              {
                label: "Settings...",
                accelerator: "CmdOrCtrl+,",
                click: () => {
                  if (mainWindow) {
                    mainWindow.webContents.send("view:settings");
                  }
                },
              },
            ]
          : []),
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
        { type: "separator" },
        {
          label: "Insert Table...",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("format:apply", "table");
            }
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle View Mode",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("view:toggle");
            }
          },
        },
        {
          label: "Split View",
          accelerator: "CmdOrCtrl+\\",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("view:split");
            }
          },
        },
        {
          label: "Toggle Outline",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("view:toggle-outline");
            }
          },
        },
        {
          label: "Focus Mode",
          accelerator: "CmdOrCtrl+Shift+Enter",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("view:focus-mode");
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
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://github.com/ACinch/EasyMarkdown");
          },
        },
        // Add Check for Updates for Windows/Linux (macOS has it in app menu)
        ...(!isMac
          ? [
              { type: "separator" as const },
              {
                label: "Check for Updates...",
                click: () => checkForUpdates(true),
              },
            ]
          : []),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

export function refreshMenu(mainWindow: BrowserWindow | null): void {
  Menu.setApplicationMenu(buildMenu(mainWindow));
}
