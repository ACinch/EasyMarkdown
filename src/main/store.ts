import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

interface StoreData {
  recentFiles: string[];
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
    return { recentFiles: [] };
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
}

export const store = new Store();
