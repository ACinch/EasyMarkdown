// Export module for PDF and HTML export

import { marked } from "marked";
import hljs from "highlight.js";
import { markedHighlight } from "marked-highlight";
import { getActiveTab } from "./tabs";

// Configure marked with highlight.js
marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

// Get current styles from CSS custom properties
function getCurrentStyles(): { fontFamily: string; fontSize: string; fgColor: string; bgColor: string } {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  return {
    fontFamily: computedStyle.getPropertyValue("--editor-font-family").trim() || "system-ui, -apple-system, sans-serif",
    fontSize: computedStyle.fontSize || "14px",
    fgColor: computedStyle.getPropertyValue("--editor-fg-color").trim() || "#1f2937",
    bgColor: computedStyle.getPropertyValue("--editor-bg-color").trim() || "#ffffff",
  };
}

// Generate full HTML document from markdown
export function generateHtmlDocument(markdown: string, title: string): string {
  const styles = getCurrentStyles();
  const htmlContent = marked.parse(markdown) as string;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: ${styles.fontFamily};
      font-size: ${styles.fontSize};
      line-height: 1.6;
      color: ${styles.fgColor};
      background-color: ${styles.bgColor};
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.2em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    p { margin: 1em 0; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background-color: rgba(175, 184, 193, 0.2);
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    pre {
      background-color: #1f2937;
      color: #e5e7eb;
      padding: 1em;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    blockquote {
      margin: 1em 0;
      padding-left: 1em;
      border-left: 4px solid #d1d5db;
      color: #6b7280;
      font-style: italic;
    }
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }
    li { margin: 0.25em 0; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 0.5em 0.75em;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 2em 0;
    }
    /* Highlight.js styles (GitHub-like) */
    .hljs { background: transparent; }
    .hljs-comment, .hljs-quote { color: #8b949e; }
    .hljs-keyword, .hljs-selector-tag { color: #ff7b72; }
    .hljs-string, .hljs-attr { color: #a5d6ff; }
    .hljs-number, .hljs-literal { color: #79c0ff; }
    .hljs-built_in, .hljs-type { color: #ffa657; }
    .hljs-function, .hljs-title { color: #d2a8ff; }
    .hljs-variable, .hljs-template-variable { color: #ffa657; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function exportToHtml(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;

  const html = generateHtmlDocument(tab.content, tab.fileName.replace(/\.md$/i, ""));

  // Get save path from user
  const defaultName = tab.fileName.replace(/\.md$/i, ".html");
  const result = await window.electron.showExportDialog("html", defaultName);

  if (result.canceled || !result.filePath) return;

  // Save the file
  const saveResult = await window.electron.exportFile(result.filePath, html);
  if (!saveResult.success) {
    console.error("Failed to export HTML:", saveResult.error);
  }
}

export async function exportToPdf(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;

  const html = generateHtmlDocument(tab.content, tab.fileName.replace(/\.md$/i, ""));

  // Get save path from user
  const defaultName = tab.fileName.replace(/\.md$/i, ".pdf");
  const result = await window.electron.showExportDialog("pdf", defaultName);

  if (result.canceled || !result.filePath) return;

  // Send HTML to main process for PDF generation
  const pdfResult = await window.electron.exportToPdf(result.filePath, html);
  if (!pdfResult.success) {
    console.error("Failed to export PDF:", pdfResult.error);
  }
}
