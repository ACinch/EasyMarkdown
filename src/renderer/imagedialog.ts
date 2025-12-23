import { insertText } from "./editor";

let dialog: HTMLElement;
let altInput: HTMLInputElement;
let urlInput: HTMLInputElement;
let filePathInput: HTMLInputElement;
let urlSection: HTMLElement;
let fileSection: HTMLElement;
let tabUrl: HTMLElement;
let tabFile: HTMLElement;

let activeTab: "url" | "file" = "url";

export function initImageDialog(): void {
  dialog = document.getElementById("image-dialog")!;
  altInput = document.getElementById("image-alt") as HTMLInputElement;
  urlInput = document.getElementById("image-url") as HTMLInputElement;
  filePathInput = document.getElementById("image-file-path") as HTMLInputElement;
  urlSection = document.getElementById("image-url-section")!;
  fileSection = document.getElementById("image-file-section")!;
  tabUrl = document.getElementById("image-tab-url")!;
  tabFile = document.getElementById("image-tab-file")!;

  const cancelBtn = document.getElementById("image-cancel")!;
  const insertBtn = document.getElementById("image-insert")!;
  const browseBtn = document.getElementById("image-file-browse")!;

  // Tab switching
  tabUrl.addEventListener("click", () => switchTab("url"));
  tabFile.addEventListener("click", () => switchTab("file"));

  // Browse button
  browseBtn.addEventListener("click", async () => {
    const result = await window.electron.showOpenImageDialog();
    if (result.success && result.filePath) {
      filePathInput.value = result.filePath;
    }
  });

  // Cancel button
  cancelBtn.addEventListener("click", () => hideDialog());

  // Insert button
  insertBtn.addEventListener("click", () => {
    const alt = altInput.value.trim() || "image";
    let src = "";

    if (activeTab === "url") {
      src = urlInput.value.trim();
    } else {
      const filePath = filePathInput.value.trim();
      if (filePath) {
        // Convert to file:// URL for local files
        src = `file://${filePath}`;
      }
    }

    if (src) {
      insertText(`![${alt}](${src})`);
    }

    hideDialog();
  });

  // Close on backdrop click
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      hideDialog();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.classList.contains("hidden")) {
      hideDialog();
    }
  });
}

function switchTab(tab: "url" | "file"): void {
  activeTab = tab;

  if (tab === "url") {
    tabUrl.className = "px-4 py-2 text-sm font-medium text-blue-400 border-b-2 border-blue-400";
    tabFile.className = "px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300";
    urlSection.classList.remove("hidden");
    fileSection.classList.add("hidden");
  } else {
    tabFile.className = "px-4 py-2 text-sm font-medium text-blue-400 border-b-2 border-blue-400";
    tabUrl.className = "px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300";
    fileSection.classList.remove("hidden");
    urlSection.classList.add("hidden");
  }
}

export function showImageDialog(): void {
  // Reset form
  altInput.value = "";
  urlInput.value = "";
  filePathInput.value = "";
  switchTab("url");

  dialog.classList.remove("hidden");
  altInput.focus();
}

function hideDialog(): void {
  dialog.classList.add("hidden");
}
