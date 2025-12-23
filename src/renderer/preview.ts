import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

let previewElement: HTMLElement | null = null;
let marked: Marked;

export function initPreview(element: HTMLElement): void {
  previewElement = element;

  // Configure marked with highlight.js
  marked = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    })
  );

  // Additional marked options
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
}

export async function renderMarkdown(content: string): Promise<void> {
  if (!previewElement) return;
  console.log("renderMarkdown called, content length:", content.length);

  try {
    const html = await marked.parse(content);
    console.log("Markdown rendered, html length:", (html as string).length);
    previewElement.innerHTML = html as string;
  } catch (error) {
    console.error("Failed to render markdown:", error);
    previewElement.innerHTML = `<p class="text-red-500">Error rendering markdown</p>`;
  }
}

export function clear(): void {
  if (previewElement) {
    previewElement.innerHTML = "";
  }
}
