// Status bar module for displaying word count, character count, and cursor position

let statusBar: HTMLElement | null = null;
let wordCountEl: HTMLElement | null = null;
let charCountEl: HTMLElement | null = null;
let cursorPosEl: HTMLElement | null = null;

export function initStatusBar(): void {
  statusBar = document.getElementById("status-bar");
  wordCountEl = document.getElementById("status-word-count");
  charCountEl = document.getElementById("status-char-count");
  cursorPosEl = document.getElementById("status-cursor-pos");
}

export function showStatusBar(): void {
  if (statusBar) {
    statusBar.classList.remove("hidden");
  }
}

export function hideStatusBar(): void {
  if (statusBar) {
    statusBar.classList.add("hidden");
  }
}

export function updateWordCount(content: string): void {
  if (!wordCountEl || !charCountEl) return;

  // Count words (split on whitespace, filter empty strings)
  const words = content.trim().split(/\s+/).filter((word) => word.length > 0);
  const wordCount = content.trim() === "" ? 0 : words.length;

  // Count characters (excluding whitespace for "characters" but including for total)
  const charCount = content.length;

  wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? "s" : ""}`;
  charCountEl.textContent = `${charCount} character${charCount !== 1 ? "s" : ""}`;
}

export function updateCursorPosition(
  lineOrStart: number | { line: number; col: number },
  content?: string
): void {
  if (!cursorPosEl) return;

  let lineNumber: number;
  let columnNumber: number;

  if (typeof lineOrStart === "object") {
    // Direct line/col format from CodeMirror
    lineNumber = lineOrStart.line;
    columnNumber = lineOrStart.col;
  } else {
    // Legacy format with selectionStart and content
    const selectionStart = lineOrStart;
    const textBeforeCursor = (content || "").substring(0, selectionStart);
    const lines = textBeforeCursor.split("\n");
    lineNumber = lines.length;
    columnNumber = lines[lines.length - 1].length + 1;
  }

  cursorPosEl.textContent = `Ln ${lineNumber}, Col ${columnNumber}`;
}
