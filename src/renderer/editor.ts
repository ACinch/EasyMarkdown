import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, placeholder, lineNumbers } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

type ContentChangeCallback = (content: string) => void;

let editorView: EditorView | null = null;
let onContentChange: ContentChangeCallback | null = null;
let containerElement: HTMLElement | null = null;

// Compartments for dynamic reconfiguration
const themeCompartment = new Compartment();
const highlightCompartment = new Compartment();

// Current theme colors
let currentColors = {
  foreground: "#e5e5e5",
  background: "#1e1e1e",
  heading: "#79c0ff",
};

// Create markdown highlighting with current colors
function createMarkdownHighlighting(headingColor: string) {
  return HighlightStyle.define([
    { tag: tags.heading1, fontWeight: "bold", fontSize: "1.4em", color: headingColor },
    { tag: tags.heading2, fontWeight: "bold", fontSize: "1.3em", color: headingColor },
    { tag: tags.heading3, fontWeight: "bold", fontSize: "1.2em", color: headingColor },
    { tag: tags.heading4, fontWeight: "bold", fontSize: "1.1em", color: headingColor },
    { tag: tags.heading5, fontWeight: "bold", color: headingColor },
    { tag: tags.heading6, fontWeight: "bold", color: headingColor },
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.link, color: "#6cb6ff", textDecoration: "underline" },
    { tag: tags.url, color: "#6cb6ff" },
    { tag: tags.monospace, color: "#f97583", backgroundColor: "rgba(110, 118, 129, 0.2)", borderRadius: "3px", padding: "1px 4px" },
    { tag: tags.quote, color: "#8b949e", fontStyle: "italic" },
    { tag: tags.list, color: "#f97583" },
    { tag: tags.processingInstruction, color: "#8b949e" },
    { tag: tags.meta, color: "#8b949e" },
  ]);
}

// Create theme with current colors
function createEditorTheme(fg: string, bg: string) {
  return EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "inherit",
      fontFamily: "inherit",
      backgroundColor: bg,
      color: fg,
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "inherit",
    },
    ".cm-content": {
      padding: "16px",
      minHeight: "100%",
      caretColor: fg,
    },
    ".cm-gutters": {
      backgroundColor: bg,
      border: "none",
      color: "#6e7681",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 16px",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(128, 128, 128, 0.1)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: fg,
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "rgba(56, 139, 253, 0.3)",
    },
    ".cm-placeholder": {
      color: "#6e7681",
    },
  });
}

export function initEditor(
  element: HTMLTextAreaElement | HTMLElement,
  changeCallback: ContentChangeCallback
): void {
  onContentChange = changeCallback;

  // Get the container - if element is textarea, get its parent
  if (element instanceof HTMLTextAreaElement) {
    containerElement = element.parentElement;
    // Hide the original textarea
    element.style.display = "none";
  } else {
    containerElement = element;
  }

  if (!containerElement) return;

  // Create a div for CodeMirror if needed
  let cmContainer = containerElement.querySelector(".cm-container") as HTMLElement;
  if (!cmContainer) {
    cmContainer = document.createElement("div");
    cmContainer.className = "cm-container flex-1";
    containerElement.appendChild(cmContainer);
  }

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && onContentChange) {
      onContentChange(update.state.doc.toString());
    }
  });

  const state = EditorState.create({
    doc: "",
    extensions: [
      lineNumbers(),
      history(),
      markdown(),
      highlightCompartment.of(syntaxHighlighting(createMarkdownHighlighting(currentColors.heading))),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      themeCompartment.of(createEditorTheme(currentColors.foreground, currentColors.background)),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      placeholder("Start writing markdown..."),
      updateListener,
      EditorView.lineWrapping,
    ],
  });

  editorView = new EditorView({
    state,
    parent: cmContainer,
  });
}

// Update theme colors dynamically
export function updateTheme(colors: { foreground: string; background: string; heading: string }): void {
  currentColors = colors;

  if (!editorView) return;

  // Reconfigure both theme and highlighting
  editorView.dispatch({
    effects: [
      themeCompartment.reconfigure(createEditorTheme(colors.foreground, colors.background)),
      highlightCompartment.reconfigure(syntaxHighlighting(createMarkdownHighlighting(colors.heading))),
    ],
  });
}

export function setContent(content: string): void {
  if (!editorView) return;

  const transaction = editorView.state.update({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: content,
    },
  });
  editorView.dispatch(transaction);
}

export function getContent(): string {
  return editorView?.state.doc.toString() || "";
}

export function focus(): void {
  editorView?.focus();
}

export function insertText(text: string): void {
  if (!editorView) return;

  const { from, to } = editorView.state.selection.main;
  const transaction = editorView.state.update({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  editorView.dispatch(transaction);
  editorView.focus();
}

export function wrapSelection(before: string, after: string): void {
  if (!editorView) return;

  const { from, to } = editorView.state.selection.main;
  const selectedText = editorView.state.sliceDoc(from, to);
  const newText = before + selectedText + after;

  const transaction = editorView.state.update({
    changes: { from, to, insert: newText },
    selection: selectedText
      ? { anchor: from + before.length, head: from + before.length + selectedText.length }
      : { anchor: from + before.length },
  });
  editorView.dispatch(transaction);
  editorView.focus();
}

export function prefixLines(prefix: string): void {
  if (!editorView) return;

  const state = editorView.state;
  const { from, to } = state.selection.main;

  // Get line range
  const fromLine = state.doc.lineAt(from);
  const toLine = state.doc.lineAt(to);

  const changes: { from: number; to: number; insert: string }[] = [];
  for (let i = fromLine.number; i <= toLine.number; i++) {
    const line = state.doc.line(i);
    changes.push({
      from: line.from,
      to: line.from,
      insert: prefix,
    });
  }

  const transaction = state.update({ changes });
  editorView.dispatch(transaction);
  editorView.focus();
}

export function prefixLinesNumbered(): void {
  if (!editorView) return;

  const state = editorView.state;
  const { from, to } = state.selection.main;

  const fromLine = state.doc.lineAt(from);
  const toLine = state.doc.lineAt(to);

  const changes: { from: number; to: number; insert: string }[] = [];
  let num = 1;
  for (let i = fromLine.number; i <= toLine.number; i++) {
    const line = state.doc.line(i);
    changes.push({
      from: line.from,
      to: line.from,
      insert: `${num}. `,
    });
    num++;
  }

  const transaction = state.update({ changes });
  editorView.dispatch(transaction);
  editorView.focus();
}

export function insertAtLineStart(text: string): void {
  if (!editorView) return;

  const state = editorView.state;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);

  const transaction = state.update({
    changes: { from: line.from, to: line.from, insert: text },
    selection: { anchor: from + text.length },
  });
  editorView.dispatch(transaction);
  editorView.focus();
}

// Get cursor position for status bar
export function getCursorPosition(): { line: number; col: number } {
  if (!editorView) return { line: 1, col: 1 };

  const { from } = editorView.state.selection.main;
  const line = editorView.state.doc.lineAt(from);

  return {
    line: line.number,
    col: from - line.from + 1,
  };
}

// Set spellcheck on CodeMirror (applies to content editable)
export function setSpellcheck(enabled: boolean): void {
  if (!editorView) return;

  const contentDom = editorView.contentDOM;
  contentDom.spellcheck = enabled;
}

// Get the editor view for advanced operations
export function getEditorView(): EditorView | null {
  return editorView;
}
