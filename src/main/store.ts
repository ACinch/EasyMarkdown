import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

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
  autoSaveInterval: number; // in seconds
  spellCheck: boolean;
}

export interface SessionTab {
  filePath: string;
  scrollPosition?: number;
}

export interface Session {
  tabs: SessionTab[];
  activeTabIndex: number;
}

const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  fontFamily: "monospace",
  theme: {
    foreground: { preset: "dark", custom: "#e5e5e5" },
    background: { preset: "dark", custom: "#1e1e1e" },
    heading: { preset: "dark", custom: "#79c0ff" },
    tableHeader: { preset: "dark", custom: "#2d333b" },
  },
  autoSave: false,
  autoSaveInterval: 30,
  spellCheck: false,
};

const DEFAULT_SESSION: Session = {
  tabs: [],
  activeTabIndex: 0,
};

interface StoreData {
  recentFiles: string[];
  settings: Settings;
  session: Session;
}

const MAX_RECENT_FILES = 10;

class Store {
  private filePath: string;
  private data: StoreData;

  constructor() {
    this.filePath = path.join(app.getPath("userData"), "store.json");
    this.data = this.load();
  }

  private load(): StoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("Failed to load store:", error);
    }
    return { recentFiles: [], settings: { ...DEFAULT_SETTINGS }, session: { ...DEFAULT_SESSION } };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("Failed to save store:", error);
    }
  }

  getRecentFiles(): string[] {
    // Filter out files that no longer exist
    this.data.recentFiles = this.data.recentFiles.filter((filePath) =>
      fs.existsSync(filePath)
    );
    this.save();
    return this.data.recentFiles;
  }

  addRecentFile(filePath: string): void {
    // Remove if already exists
    this.data.recentFiles = this.data.recentFiles.filter((f) => f !== filePath);
    // Add to beginning
    this.data.recentFiles.unshift(filePath);
    // Keep only MAX_RECENT_FILES
    this.data.recentFiles = this.data.recentFiles.slice(0, MAX_RECENT_FILES);
    this.save();
  }

  clearRecentFiles(): void {
    this.data.recentFiles = [];
    this.save();
  }

  getSettings(): Settings {
    // Ensure settings exist (for migration from older store versions)
    if (!this.data.settings) {
      this.data.settings = { ...DEFAULT_SETTINGS };
      this.save();
    }

    // Migrate from old settings format (foregroundColor/backgroundColor strings)
    // to new theme object format
    const settings = this.data.settings as any;
    if (!settings.theme) {
      // Old format detected, migrate to new format
      this.data.settings = {
        fontSize: settings.fontSize || DEFAULT_SETTINGS.fontSize,
        fontFamily: settings.fontFamily || DEFAULT_SETTINGS.fontFamily,
        theme: { ...DEFAULT_SETTINGS.theme },
        autoSave: settings.autoSave ?? DEFAULT_SETTINGS.autoSave,
        autoSaveInterval: settings.autoSaveInterval || DEFAULT_SETTINGS.autoSaveInterval,
        spellCheck: settings.spellCheck ?? DEFAULT_SETTINGS.spellCheck,
      };
      this.save();
    }

    return { ...this.data.settings };
  }

  setSettings(settings: Settings): void {
    this.data.settings = { ...settings };
    this.save();
  }

  resetSettings(): void {
    this.data.settings = { ...DEFAULT_SETTINGS };
    this.save();
  }

  getSession(): Session {
    // Ensure session exists (for migration from older store versions)
    if (!this.data.session) {
      this.data.session = { ...DEFAULT_SESSION };
      this.save();
    }
    // Filter out tabs for files that no longer exist
    const validTabs = this.data.session.tabs.filter((tab) =>
      fs.existsSync(tab.filePath)
    );
    if (validTabs.length !== this.data.session.tabs.length) {
      this.data.session.tabs = validTabs;
      // Adjust activeTabIndex if needed
      if (this.data.session.activeTabIndex >= validTabs.length) {
        this.data.session.activeTabIndex = Math.max(0, validTabs.length - 1);
      }
      this.save();
    }
    return { ...this.data.session, tabs: [...this.data.session.tabs] };
  }

  setSession(session: Session): void {
    this.data.session = { ...session, tabs: [...session.tabs] };
    this.save();
  }

  clearSession(): void {
    this.data.session = { ...DEFAULT_SESSION };
    this.save();
  }
}

export const store = new Store();
