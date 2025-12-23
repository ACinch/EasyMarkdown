type ContentChangeCallback = (content: string) => void;

let editorElement: HTMLTextAreaElement | null = null;
let onContentChange: ContentChangeCallback | null = null;

export function initEditor(
  element: HTMLTextAreaElement,
  changeCallback: ContentChangeCallback
): void {
  editorElement = element;
  onContentChange = changeCallback;

  editorElement.addEventListener("input", () => {
    if (editorElement && onContentChange) {
      onContentChange(editorElement.value);
    }
  });

  // Handle tab key for indentation
  editorElement.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertText("\t");
    }
  });
}

export function setContent(content: string): void {
  if (editorElement) {
    editorElement.value = content;
  }
}

export function getContent(): string {
  return editorElement?.value || "";
}

export function focus(): void {
  editorElement?.focus();
}

export function insertText(text: string): void {
  if (!editorElement) return;

  const start = editorElement.selectionStart;
  const end = editorElement.selectionEnd;
  const value = editorElement.value;

  editorElement.value = value.substring(0, start) + text + value.substring(end);
  editorElement.selectionStart = editorElement.selectionEnd = start + text.length;
  editorElement.focus();

  onContentChange?.(editorElement.value);
}

export function wrapSelection(before: string, after: string): void {
  if (!editorElement) return;

  const start = editorElement.selectionStart;
  const end = editorElement.selectionEnd;
  const value = editorElement.value;
  const selectedText = value.substring(start, end);

  const newText = before + selectedText + after;
  editorElement.value = value.substring(0, start) + newText + value.substring(end);

  // Position cursor after the wrapped text or select the wrapped text
  if (selectedText) {
    editorElement.selectionStart = start + before.length;
    editorElement.selectionEnd = start + before.length + selectedText.length;
  } else {
    editorElement.selectionStart = editorElement.selectionEnd = start + before.length;
  }

  editorElement.focus();
  onContentChange?.(editorElement.value);
}

export function prefixLines(prefix: string): void {
  if (!editorElement) return;

  const start = editorElement.selectionStart;
  const end = editorElement.selectionEnd;
  const value = editorElement.value;

  // Find the start of the first line and end of the last line
  let lineStart = value.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = value.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = value.length;

  const selectedLines = value.substring(lineStart, lineEnd);
  const lines = selectedLines.split("\n");
  const prefixedLines = lines.map((line) => prefix + line).join("\n");

  editorElement.value =
    value.substring(0, lineStart) + prefixedLines + value.substring(lineEnd);

  // Adjust selection
  editorElement.selectionStart = lineStart;
  editorElement.selectionEnd = lineStart + prefixedLines.length;

  editorElement.focus();
  onContentChange?.(editorElement.value);
}

export function prefixLinesNumbered(): void {
  if (!editorElement) return;

  const start = editorElement.selectionStart;
  const end = editorElement.selectionEnd;
  const value = editorElement.value;

  let lineStart = value.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = value.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = value.length;

  const selectedLines = value.substring(lineStart, lineEnd);
  const lines = selectedLines.split("\n");
  const numberedLines = lines.map((line, i) => `${i + 1}. ${line}`).join("\n");

  editorElement.value =
    value.substring(0, lineStart) + numberedLines + value.substring(lineEnd);

  editorElement.selectionStart = lineStart;
  editorElement.selectionEnd = lineStart + numberedLines.length;

  editorElement.focus();
  onContentChange?.(editorElement.value);
}

export function insertAtLineStart(text: string): void {
  if (!editorElement) return;

  const start = editorElement.selectionStart;
  const value = editorElement.value;

  // Find the start of the current line
  let lineStart = value.lastIndexOf("\n", start - 1) + 1;

  editorElement.value =
    value.substring(0, lineStart) + text + value.substring(lineStart);

  editorElement.selectionStart = editorElement.selectionEnd = start + text.length;

  editorElement.focus();
  onContentChange?.(editorElement.value);
}
