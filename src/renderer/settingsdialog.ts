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
  autoSaveInterval: number;
  spellCheck: boolean;
}

// Predefined color values for light and dark presets
const THEME_COLORS = {
  foreground: { light: "#1f2937", dark: "#e5e5e5" },
  background: { light: "#ffffff", dark: "#1e1e1e" },
  heading: { light: "#1e40af", dark: "#79c0ff" },
  tableHeader: { light: "#f3f4f6", dark: "#2d333b" },
};

let dialog: HTMLElement;
let fontSizeSelect: HTMLSelectElement;
let fontFamilySelect: HTMLSelectElement;

// Theme color elements
let fgPresetSelect: HTMLSelectElement;
let fgColorInput: HTMLInputElement;
let bgPresetSelect: HTMLSelectElement;
let bgColorInput: HTMLInputElement;
let headingPresetSelect: HTMLSelectElement;
let headingColorInput: HTMLInputElement;
let tableHeaderPresetSelect: HTMLSelectElement;
let tableHeaderColorInput: HTMLInputElement;

let autoSaveCheckbox: HTMLInputElement;
let autoSaveIntervalSelect: HTMLSelectElement;
let autoSaveIntervalSection: HTMLElement;
let spellCheckCheckbox: HTMLInputElement;
let saveBtn: HTMLButtonElement;
let cancelBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;

let currentSettings: Settings;
let onSaveCallback: ((settings: Settings) => void) | null = null;

function setupColorPresetHandler(
  presetSelect: HTMLSelectElement,
  colorInput: HTMLInputElement,
  colorKey: keyof typeof THEME_COLORS
): void {
  // Show/hide color picker based on preset
  const updateColorVisibility = () => {
    if (presetSelect.value === "custom") {
      colorInput.classList.remove("hidden");
    } else {
      colorInput.classList.add("hidden");
      // Set the color input to the preset value for reference
      colorInput.value = THEME_COLORS[colorKey][presetSelect.value as "light" | "dark"];
    }
  };

  presetSelect.addEventListener("change", updateColorVisibility);

  // When color input changes, ensure preset stays on custom
  colorInput.addEventListener("input", () => {
    presetSelect.value = "custom";
  });
}

export function initSettingsDialog(onSave: (settings: Settings) => void): void {
  onSaveCallback = onSave;

  dialog = document.getElementById("settings-dialog")!;
  fontSizeSelect = document.getElementById("settings-font-size") as HTMLSelectElement;
  fontFamilySelect = document.getElementById("settings-font-family") as HTMLSelectElement;

  // Make font dropdown preview the selected font
  fontFamilySelect.style.fontFamily = fontFamilySelect.value;
  fontFamilySelect.addEventListener("change", () => {
    fontFamilySelect.style.fontFamily = fontFamilySelect.value;
  });

  // Theme color elements
  fgPresetSelect = document.getElementById("settings-fg-preset") as HTMLSelectElement;
  fgColorInput = document.getElementById("settings-fg-color") as HTMLInputElement;
  bgPresetSelect = document.getElementById("settings-bg-preset") as HTMLSelectElement;
  bgColorInput = document.getElementById("settings-bg-color") as HTMLInputElement;
  headingPresetSelect = document.getElementById("settings-heading-preset") as HTMLSelectElement;
  headingColorInput = document.getElementById("settings-heading-color") as HTMLInputElement;
  tableHeaderPresetSelect = document.getElementById("settings-table-header-preset") as HTMLSelectElement;
  tableHeaderColorInput = document.getElementById("settings-table-header-color") as HTMLInputElement;

  autoSaveCheckbox = document.getElementById("settings-auto-save") as HTMLInputElement;
  autoSaveIntervalSelect = document.getElementById("settings-auto-save-interval") as HTMLSelectElement;
  autoSaveIntervalSection = document.getElementById("auto-save-interval-section")!;
  spellCheckCheckbox = document.getElementById("settings-spell-check") as HTMLInputElement;
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

  // Set up color preset handlers
  setupColorPresetHandler(fgPresetSelect, fgColorInput, "foreground");
  setupColorPresetHandler(bgPresetSelect, bgColorInput, "background");
  setupColorPresetHandler(headingPresetSelect, headingColorInput, "heading");
  setupColorPresetHandler(tableHeaderPresetSelect, tableHeaderColorInput, "tableHeader");

  // Auto-save checkbox toggle
  autoSaveCheckbox.addEventListener("change", () => {
    if (autoSaveCheckbox.checked) {
      autoSaveIntervalSection.classList.remove("hidden");
    } else {
      autoSaveIntervalSection.classList.add("hidden");
    }
  });
}

function populateColorSetting(
  presetSelect: HTMLSelectElement,
  colorInput: HTMLInputElement,
  setting: { preset: ThemePreset; custom: string },
  colorKey: keyof typeof THEME_COLORS
): void {
  presetSelect.value = setting.preset;

  if (setting.preset === "custom") {
    colorInput.value = setting.custom;
    colorInput.classList.remove("hidden");
  } else {
    colorInput.value = THEME_COLORS[colorKey][setting.preset as "light" | "dark"];
    colorInput.classList.add("hidden");
  }
}

export function showSettingsDialog(settings: Settings): void {
  currentSettings = { ...settings };

  // Populate form with current settings
  fontSizeSelect.value = String(settings.fontSize);
  fontFamilySelect.value = settings.fontFamily;
  fontFamilySelect.style.fontFamily = settings.fontFamily;

  // Handle theme colors
  populateColorSetting(fgPresetSelect, fgColorInput, settings.theme.foreground, "foreground");
  populateColorSetting(bgPresetSelect, bgColorInput, settings.theme.background, "background");
  populateColorSetting(headingPresetSelect, headingColorInput, settings.theme.heading, "heading");
  populateColorSetting(tableHeaderPresetSelect, tableHeaderColorInput, settings.theme.tableHeader, "tableHeader");

  // Handle auto-save
  autoSaveCheckbox.checked = settings.autoSave;
  autoSaveIntervalSelect.value = String(settings.autoSaveInterval);
  if (settings.autoSave) {
    autoSaveIntervalSection.classList.remove("hidden");
  } else {
    autoSaveIntervalSection.classList.add("hidden");
  }

  // Handle spell check
  spellCheckCheckbox.checked = settings.spellCheck;

  dialog.classList.remove("hidden");
}

function hideDialog(): void {
  dialog.classList.add("hidden");
}

function getColorSetting(
  presetSelect: HTMLSelectElement,
  colorInput: HTMLInputElement
): { preset: ThemePreset; custom: string } {
  const preset = presetSelect.value as ThemePreset;
  return {
    preset,
    custom: colorInput.value,
  };
}

function getFormSettings(): Settings {
  return {
    fontSize: parseInt(fontSizeSelect.value, 10),
    fontFamily: fontFamilySelect.value,
    theme: {
      foreground: getColorSetting(fgPresetSelect, fgColorInput),
      background: getColorSetting(bgPresetSelect, bgColorInput),
      heading: getColorSetting(headingPresetSelect, headingColorInput),
      tableHeader: getColorSetting(tableHeaderPresetSelect, tableHeaderColorInput),
    },
    autoSave: autoSaveCheckbox.checked,
    autoSaveInterval: parseInt(autoSaveIntervalSelect.value, 10),
    spellCheck: spellCheckCheckbox.checked,
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

// Export color constants for use by other modules
export { THEME_COLORS };
