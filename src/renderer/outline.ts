// Document Outline module

interface HeadingNode {
  level: number;
  text: string;
  line: number;
  children: HeadingNode[];
}

let outlinePanel: HTMLElement | null = null;
let outlineContent: HTMLElement | null = null;
let isVisible = false;
let currentContent = "";
let onScrollToLine: ((line: number) => void) | null = null;

export function initOutline(scrollCallback: (line: number) => void): void {
  outlinePanel = document.getElementById("outline-panel");
  outlineContent = document.getElementById("outline-content");
  onScrollToLine = scrollCallback;

  // Close button
  document.getElementById("outline-close")?.addEventListener("click", hideOutline);
}

export function showOutline(content?: string): void {
  if (!outlinePanel) return;
  outlinePanel.classList.remove("hidden");
  isVisible = true;
  // Use provided content or currentContent
  if (content !== undefined) {
    currentContent = content;
  }
  // Force render even if content hasn't changed
  const headings = parseHeadings(currentContent);
  const tree = buildTree(headings);
  renderTree(tree);
}

export function hideOutline(): void {
  if (!outlinePanel) return;
  outlinePanel.classList.add("hidden");
  isVisible = false;
}

export function toggleOutline(content?: string): void {
  if (isVisible) {
    hideOutline();
  } else {
    showOutline(content);
  }
}

export function updateOutline(content: string): void {
  currentContent = content;
  if (!isVisible || !outlineContent) return;

  const headings = parseHeadings(content);
  const tree = buildTree(headings);
  renderTree(tree);
}

function parseHeadings(content: string): { level: number; text: string; line: number }[] {
  const lines = content.split("\n");
  const headings: { level: number; text: string; line: number }[] = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index + 1,
      });
    }
  });

  return headings;
}

function buildTree(headings: { level: number; text: string; line: number }[]): HeadingNode[] {
  const root: HeadingNode[] = [];
  const stack: { node: HeadingNode; level: number }[] = [];

  for (const heading of headings) {
    const node: HeadingNode = {
      level: heading.level,
      text: heading.text,
      line: heading.line,
      children: [],
    };

    // Find parent level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, level: heading.level });
  }

  return root;
}

function renderTree(nodes: HeadingNode[]): void {
  if (!outlineContent) return;

  if (nodes.length === 0) {
    outlineContent.innerHTML = '<p class="outline-empty">No headings found</p>';
    return;
  }

  outlineContent.innerHTML = "";
  const ul = createTreeElement(nodes);
  outlineContent.appendChild(ul);
}

function createTreeElement(nodes: HeadingNode[]): HTMLElement {
  const ul = document.createElement("ul");
  ul.className = "outline-list";

  for (const node of nodes) {
    const li = document.createElement("li");
    li.className = "outline-item";

    const wrapper = document.createElement("div");
    wrapper.className = "outline-item-wrapper";

    // Expand/collapse toggle if has children
    if (node.children.length > 0) {
      const toggle = document.createElement("button");
      toggle.className = "outline-toggle";
      toggle.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>`;
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        li.classList.toggle("collapsed");
      });
      wrapper.appendChild(toggle);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "outline-spacer";
      wrapper.appendChild(spacer);
    }

    const link = document.createElement("a");
    link.className = `outline-link level-${node.level}`;
    link.textContent = node.text;
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (onScrollToLine) {
        onScrollToLine(node.line);
      }
    });
    wrapper.appendChild(link);

    li.appendChild(wrapper);

    // Add children recursively
    if (node.children.length > 0) {
      const childUl = createTreeElement(node.children);
      li.appendChild(childUl);
    }

    ul.appendChild(li);
  }

  return ul;
}
