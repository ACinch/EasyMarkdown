export interface Settings {
  fontSize: number;
  fontFamily: string;
  foregroundColor: string;
  backgroundColor: string;
}

let dialog: HTMLElement;
let fontSizeSelect: HTMLSelectElement;
let fontFamilySelect: HTMLSelectElement;
let fgColorInput: HTMLInputElement;
let fgPresetSelect: HTMLSelectElement;
let bgColorInput: HTMLInputElement;
let bgPresetSelect: HTMLSelectElement;
let saveBtn: HTMLButtonElement;
let cancelBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;

let currentSettings: Settings;
let onSaveCallback: ((settings: Settings) => void) | null = null;

export function initSettingsDialog(onSave: (settings: Settings) => void): void {
  onSaveCallback = onSave;

  dialog = document.getElementById("settings-dialog")!;
  fontSizeSelect = document.getElementById("settings-font-size") as HTMLSelectElement;
  fontFamilySelect = document.getElementById("settings-font-family") as HTMLSelectElement;
  fgColorInput = document.getElementById("settings-fg-color") as HTMLInputElement;
  fgPresetSelect = document.getElementById("settings-fg-preset") as HTMLSelectElement;
  bgColorInput = document.getElementById("settings-bg-color") as HTMLInputElement;
  bgPresetSelect = document.getElementById("settings-bg-preset") as HTMLSelectElement;
  saveBtn = document.getElementById("settings-save") as HTMLButtonElement;
  cancelBtn = document.getElementById("settings-cancel") as HTMLButtonElement;
  resetBtn = document.getElementById("settings-reset") as HTMLButtonElement;

  // Event listeners
  saveBtn.addEventListener("click", handleSave);
  cancelBtn.addEventListener("click", hideDialog);
  resetBtn.addEventListener("click", handleReset);

  // Close on backdrop click
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      hideDialog();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.classList.contains("hidden")) {
      hideDialog();
    }
  });

  // Handle preset changes
  fgPresetSelect.addEventListener("change", () => {
    if (fgPresetSelect.value === "default") {
      fgColorInput.value = "#e5e5e5";
    }
  });

  bgPresetSelect.addEventListener("change", () => {
    if (bgPresetSelect.value === "default") {
      bgColorInput.value = "#1e1e1e";
    }
  });

  // When color input is clicked or changed, switch to custom
  fgColorInput.addEventListener("click", () => {
    fgPresetSelect.value = "custom";
  });

  fgColorInput.addEventListener("input", () => {
    fgPresetSelect.value = "custom";
  });

  bgColorInput.addEventListener("click", () => {
    bgPresetSelect.value = "custom";
  });

  bgColorInput.addEventListener("input", () => {
    bgPresetSelect.value = "custom";
  });
}

export function showSettingsDialog(settings: Settings): void {
  currentSettings = { ...settings };

  // Populate form with current settings
  fontSizeSelect.value = String(settings.fontSize);
  fontFamilySelect.value = settings.fontFamily;

  // Handle foreground color
  if (settings.foregroundColor === "default") {
    fgPresetSelect.value = "default";
    fgColorInput.value = "#e5e5e5";
  } else {
    fgPresetSelect.value = "custom";
    fgColorInput.value = settings.foregroundColor;
  }

  // Handle background color
  if (settings.backgroundColor === "default") {
    bgPresetSelect.value = "default";
    bgColorInput.value = "#1e1e1e";
  } else {
    bgPresetSelect.value = "custom";
    bgColorInput.value = settings.backgroundColor;
  }

  dialog.classList.remove("hidden");
}

function hideDialog(): void {
  dialog.classList.add("hidden");
}

function getFormSettings(): Settings {
  return {
    fontSize: parseInt(fontSizeSelect.value, 10),
    fontFamily: fontFamilySelect.value,
    foregroundColor: fgPresetSelect.value === "default" ? "default" : fgColorInput.value,
    backgroundColor: bgPresetSelect.value === "default" ? "default" : bgColorInput.value,
  };
}

function handleSave(): void {
  const settings = getFormSettings();
  if (onSaveCallback) {
    onSaveCallback(settings);
  }
  hideDialog();
}

async function handleReset(): Promise<void> {
  const result = await window.electron.resetSettings();
  if (result.success && result.settings) {
    showSettingsDialog(result.settings);
    if (onSaveCallback) {
      onSaveCallback(result.settings);
    }
  }
}
