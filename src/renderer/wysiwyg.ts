import { Editor, rootCtx, defaultValueCtx, editorViewCtx, commandsCtx } from "@milkdown/kit/core";
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  insertHrCommand,
} from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { getMarkdown, replaceAll, insert } from "@milkdown/kit/utils";
import { nord } from "@milkdown/theme-nord";

let editor: Editor | null = null;
let containerElement: HTMLElement | null = null;
let onChangeCallback: ((content: string) => void) | null = null;

export async function initWysiwyg(
  container: HTMLElement,
  onChange: (content: string) => void
): Promise<void> {
  containerElement = container;
  onChangeCallback = onChange;
}

export async function createEditor(initialContent: string = ""): Promise<void> {
  if (!containerElement) return;

  // Destroy existing editor if any
  if (editor) {
    await destroyEditor();
  }

  // Clear container
  containerElement.innerHTML = "";

  editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, containerElement!);
      ctx.set(defaultValueCtx, initialContent);
    })
    .config(nord)
    .use(commonmark)
    .use(gfm)
    .use(listener)
    .config((ctx) => {
      const listenerManager = ctx.get(listenerCtx);
      listenerManager.markdownUpdated((_ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown && onChangeCallback) {
          onChangeCallback(markdown);
        }
      });
    })
    .create();
}

export async function setContent(content: string): Promise<void> {
  if (!editor) {
    await createEditor(content);
    return;
  }

  editor.action(replaceAll(content));
}

export function getContent(): string {
  if (!editor) return "";
  return editor.action(getMarkdown());
}

export function focus(): void {
  if (!editor) return;
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    view.focus();
  });
}

export async function destroyEditor(): Promise<void> {
  if (editor) {
    await editor.destroy();
    editor = null;
  }
}

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
  if (!editor) return;

  // Handle formats that need direct markdown insertion
  if (format === "codeblock") {
    editor.action(insert("```\n\n```"));
    return;
  }
  if (format === "link") {
    editor.action(insert("[text](url)"));
    return;
  }

  editor.action((ctx) => {
    const commands = ctx.get(commandsCtx);

    switch (format) {
      case "bold":
        commands.call(toggleStrongCommand.key);
        break;
      case "italic":
        commands.call(toggleEmphasisCommand.key);
        break;
      case "h1":
        commands.call(wrapInHeadingCommand.key, 1);
        break;
      case "h2":
        commands.call(wrapInHeadingCommand.key, 2);
        break;
      case "h3":
        commands.call(wrapInHeadingCommand.key, 3);
        break;
      case "code":
        commands.call(toggleInlineCodeCommand.key);
        break;
      case "ul":
        commands.call(wrapInBulletListCommand.key);
        break;
      case "ol":
        commands.call(wrapInOrderedListCommand.key);
        break;
      case "quote":
        commands.call(wrapInBlockquoteCommand.key);
        break;
    }
  });
}

export function isEditorActive(): boolean {
  return editor !== null;
}

export function insertMarkdown(markdown: string): void {
  if (!editor) return;
  editor.action(insert(markdown));
}
