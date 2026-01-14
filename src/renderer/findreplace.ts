// Find and Replace module - CodeMirror compatible

import { getContent, setContent, getEditorView, focus as focusEditor } from "./editor";

let findBar: HTMLElement | null = null;
let findInput: HTMLInputElement | null = null;
let replaceInput: HTMLInputElement | null = null;
let replaceSection: HTMLElement | null = null;
let matchCountEl: HTMLElement | null = null;
let isReplaceMode = false;

// State
let currentMatchIndex = -1;
let matches: { start: number; end: number }[] = [];

export function initFindReplace(_editor: HTMLTextAreaElement | HTMLElement): void {
  findBar = document.getElementById("find-bar");
  findInput = document.getElementById("find-input") as HTMLInputElement;
  replaceInput = document.getElementById("replace-input") as HTMLInputElement;
  replaceSection = document.getElementById("replace-section");
  matchCountEl = document.getElementById("find-match-count");

  // Set up event listeners
  findInput?.addEventListener("input", handleFindInputChange);
  findInput?.addEventListener("keydown", handleFindKeydown);
  replaceInput?.addEventListener("keydown", handleReplaceKeydown);

  document.getElementById("find-prev")?.addEventListener("click", findPrev);
  document.getElementById("find-next")?.addEventListener("click", findNext);
  document.getElementById("find-close")?.addEventListener("click", hideFindBar);
  document.getElementById("replace-one")?.addEventListener("click", replaceOne);
  document.getElementById("replace-all")?.addEventListener("click", replaceAll);
}

export function showFind(): void {
  if (!findBar || !findInput) return;

  isReplaceMode = false;
  findBar.classList.remove("hidden");
  replaceSection?.classList.add("hidden");
  findInput.focus();

  // If there's selected text, use it as the search term
  const editorView = getEditorView();
  if (editorView) {
    const { from, to } = editorView.state.selection.main;
    const selectedText = editorView.state.sliceDoc(from, to);
    if (selectedText && !selectedText.includes("\n")) {
      findInput.value = selectedText;
      handleFindInputChange();
    }
  }

  findInput.select();
}

export function showReplace(): void {
  if (!findBar || !findInput) return;

  isReplaceMode = true;
  findBar.classList.remove("hidden");
  replaceSection?.classList.remove("hidden");
  findInput.focus();

  // If there's selected text, use it as the search term
  const editorView = getEditorView();
  if (editorView) {
    const { from, to } = editorView.state.selection.main;
    const selectedText = editorView.state.sliceDoc(from, to);
    if (selectedText && !selectedText.includes("\n")) {
      findInput.value = selectedText;
      handleFindInputChange();
    }
  }

  findInput.select();
}

export function hideFindBar(): void {
  if (!findBar) return;

  findBar.classList.add("hidden");
  matches = [];
  currentMatchIndex = -1;
  updateMatchCount();

  // Return focus to editor
  focusEditor();
}

function handleFindKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    hideFindBar();
  } else if (e.key === "Enter") {
    if (e.shiftKey) {
      findPrev();
    } else {
      findNext();
    }
  }
}

function handleReplaceKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    hideFindBar();
  } else if (e.key === "Enter") {
    replaceOne();
  }
}

function handleFindInputChange(): void {
  const searchTerm = findInput?.value || "";

  if (!searchTerm) {
    matches = [];
    currentMatchIndex = -1;
    updateMatchCount();
    return;
  }

  // Find all matches
  findAllMatches(searchTerm);

  // If we have matches, go to the first one after cursor
  const editorView = getEditorView();
  if (matches.length > 0 && editorView) {
    const cursorPos = editorView.state.selection.main.from;
    currentMatchIndex = matches.findIndex((m) => m.start >= cursorPos);
    if (currentMatchIndex === -1) {
      currentMatchIndex = 0;
    }
    highlightCurrentMatch();
  }

  updateMatchCount();
}

function findAllMatches(searchTerm: string): void {
  matches = [];
  const content = getContent();
  const searchLower = searchTerm.toLowerCase();
  const contentLower = content.toLowerCase();

  let pos = 0;
  while (pos < content.length) {
    const index = contentLower.indexOf(searchLower, pos);
    if (index === -1) break;

    matches.push({
      start: index,
      end: index + searchTerm.length,
    });
    pos = index + 1;
  }
}

function highlightCurrentMatch(): void {
  const editorView = getEditorView();
  if (!editorView || currentMatchIndex < 0 || currentMatchIndex >= matches.length)
    return;

  const match = matches[currentMatchIndex];

  // Set selection in CodeMirror
  editorView.dispatch({
    selection: { anchor: match.start, head: match.end },
    scrollIntoView: true,
  });
  editorView.focus();
}

export function findNext(): void {
  if (matches.length === 0) return;

  currentMatchIndex = (currentMatchIndex + 1) % matches.length;
  highlightCurrentMatch();
  updateMatchCount();
}

export function findPrev(): void {
  if (matches.length === 0) return;

  currentMatchIndex =
    (currentMatchIndex - 1 + matches.length) % matches.length;
  highlightCurrentMatch();
  updateMatchCount();
}

function replaceOne(): void {
  const editorView = getEditorView();
  if (!editorView || !replaceInput || matches.length === 0) return;

  const match = matches[currentMatchIndex];
  const replacement = replaceInput.value;

  // Replace the current match using CodeMirror transaction
  editorView.dispatch({
    changes: { from: match.start, to: match.end, insert: replacement },
  });

  // Recalculate matches
  handleFindInputChange();
}

function replaceAll(): void {
  const editorView = getEditorView();
  if (!editorView || !findInput || !replaceInput) return;

  const searchTerm = findInput.value;
  const replacement = replaceInput.value;

  if (!searchTerm) return;

  // Simple case-insensitive replace all
  const content = getContent();
  const regex = new RegExp(escapeRegExp(searchTerm), "gi");
  const newContent = content.replace(regex, replacement);

  // Update editor content
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: newContent },
  });

  // Clear matches
  matches = [];
  currentMatchIndex = -1;
  updateMatchCount();
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateMatchCount(): void {
  if (!matchCountEl) return;

  if (matches.length === 0) {
    if (findInput?.value) {
      matchCountEl.textContent = "No results";
    } else {
      matchCountEl.textContent = "";
    }
  } else {
    matchCountEl.textContent = `${currentMatchIndex + 1} of ${matches.length}`;
  }
}
