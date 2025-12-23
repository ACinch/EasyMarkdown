import {
  wrapSelection,
  prefixLines,
  prefixLinesNumbered,
  insertAtLineStart,
} from "./editor";
import { showImageDialog } from "./imagedialog";

export type FormatType =
  | "bold"
  | "italic"
  | "h1"
  | "h2"
  | "h3"
  | "code"
  | "codeblock"
  | "link"
  | "image"
  | "ul"
  | "ol"
  | "quote";

export function applyFormat(format: FormatType): void {
  switch (format) {
    case "bold":
      wrapSelection("**", "**");
      break;
    case "italic":
      wrapSelection("*", "*");
      break;
    case "h1":
      insertAtLineStart("# ");
      break;
    case "h2":
      insertAtLineStart("## ");
      break;
    case "h3":
      insertAtLineStart("### ");
      break;
    case "code":
      wrapSelection("`", "`");
      break;
    case "codeblock":
      wrapSelection("```\n", "\n```");
      break;
    case "link":
      wrapSelection("[", "](url)");
      break;
    case "image":
      showImageDialog();
      break;
    case "ul":
      prefixLines("- ");
      break;
    case "ol":
      prefixLinesNumbered();
      break;
    case "quote":
      prefixLines("> ");
      break;
  }
}

export function initCommandBar(container: HTMLElement): void {
  const buttons = container.querySelectorAll("[data-format]");

  buttons.forEach((button) => {
    // Use mousedown with preventDefault to avoid stealing focus from editor
    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const format = (button as HTMLElement).dataset.format as FormatType;
      if (format) {
        applyFormat(format);
      }
    });
  });
}
