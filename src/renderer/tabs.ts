export interface Tab {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  savedContent: string;
  isDirty: boolean;
}

type TabChangeCallback = (tab: Tab | null) => void;
type TabsUpdateCallback = (tabs: Tab[]) => void;

let tabs: Tab[] = [];
let activeTabId: string | null = null;
let onTabChange: TabChangeCallback | null = null;
let onTabsUpdate: TabsUpdateCallback | null = null;

let tabsContainer: HTMLElement | null = null;

export function initTabs(
  container: HTMLElement,
  changeCallback: TabChangeCallback,
  updateCallback: TabsUpdateCallback
): void {
  tabsContainer = container;
  onTabChange = changeCallback;
  onTabsUpdate = updateCallback;
}

function generateId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createTab(
  filePath: string | null = null,
  fileName: string = "Untitled",
  content: string = ""
): Tab {
  const tab: Tab = {
    id: generateId(),
    filePath,
    fileName,
    content,
    savedContent: content,
    isDirty: false,
  };

  tabs.push(tab);
  renderTabs();
  setActiveTab(tab.id);
  onTabsUpdate?.(tabs);

  return tab;
}

export function getTab(id: string): Tab | undefined {
  return tabs.find((t) => t.id === id);
}

export function getActiveTab(): Tab | null {
  if (!activeTabId) return null;
  return getTab(activeTabId) || null;
}

export function getAllTabs(): Tab[] {
  return [...tabs];
}

export function setActiveTab(id: string): void {
  const tab = getTab(id);
  if (!tab) return;

  activeTabId = id;
  renderTabs();
  onTabChange?.(tab);
}

export function updateTabContent(id: string, content: string): void {
  const tab = getTab(id);
  if (!tab) return;

  tab.content = content;
  tab.isDirty = content !== tab.savedContent;
  renderTabs();
}

export function markTabSaved(id: string, filePath?: string, fileName?: string): void {
  const tab = getTab(id);
  if (!tab) return;

  tab.savedContent = tab.content;
  tab.isDirty = false;
  if (filePath !== undefined) tab.filePath = filePath;
  if (fileName !== undefined) tab.fileName = fileName;
  renderTabs();
  onTabsUpdate?.(tabs);
}

export function findTabByPath(filePath: string): Tab | undefined {
  return tabs.find((t) => t.filePath === filePath);
}

export async function closeTab(id: string): Promise<boolean> {
  const tab = getTab(id);
  if (!tab) return false;

  if (tab.isDirty) {
    const electron = (window as any).electron;
    const result = await electron.showConfirmDialog(
      `Do you want to save changes to "${tab.fileName}"?`,
      "Your changes will be lost if you don't save them."
    );

    if (result === 1) {
      // Cancel
      return false;
    }

    if (result === 2) {
      // Save
      // This will be handled by the caller
      return false;
    }
    // result === 0: Don't Save - continue closing
  }

  const index = tabs.findIndex((t) => t.id === id);
  tabs = tabs.filter((t) => t.id !== id);

  if (activeTabId === id) {
    // Activate adjacent tab
    if (tabs.length > 0) {
      const newIndex = Math.min(index, tabs.length - 1);
      setActiveTab(tabs[newIndex].id);
    } else {
      activeTabId = null;
      onTabChange?.(null);
    }
  }

  renderTabs();
  onTabsUpdate?.(tabs);
  return true;
}

let contextMenu: HTMLElement | null = null;

function hideContextMenu(): void {
  if (contextMenu) {
    contextMenu.remove();
    contextMenu = null;
  }
}

function showContextMenu(e: MouseEvent, tabId: string): void {
  e.preventDefault();
  hideContextMenu();

  contextMenu = document.createElement("div");
  contextMenu.className = "tab-context-menu";

  const closeItem = document.createElement("div");
  closeItem.className = "tab-context-menu-item";
  closeItem.textContent = "Close";
  closeItem.addEventListener("click", () => {
    hideContextMenu();
    closeTab(tabId);
  });

  const closeOthersItem = document.createElement("div");
  closeOthersItem.className = "tab-context-menu-item";
  closeOthersItem.textContent = "Close Others";
  closeOthersItem.addEventListener("click", () => {
    hideContextMenu();
    closeOtherTabs(tabId);
  });

  const closeAllItem = document.createElement("div");
  closeAllItem.className = "tab-context-menu-item";
  closeAllItem.textContent = "Close All";
  closeAllItem.addEventListener("click", () => {
    hideContextMenu();
    closeAllTabs();
  });

  contextMenu.appendChild(closeItem);
  contextMenu.appendChild(closeOthersItem);
  contextMenu.appendChild(closeAllItem);

  // Position the menu
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;

  document.body.appendChild(contextMenu);

  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener("click", hideContextMenu, { once: true });
  }, 0);
}

function renderTabs(): void {
  if (!tabsContainer) return;
  const container = tabsContainer;

  container.innerHTML = "";

  tabs.forEach((tab) => {
    const tabEl = document.createElement("div");
    tabEl.className = `tab ${tab.id === activeTabId ? "active" : ""}`;
    tabEl.dataset.tabId = tab.id;

    const titleEl = document.createElement("span");
    titleEl.className = "tab-title";
    titleEl.textContent = tab.fileName;
    tabEl.appendChild(titleEl);

    if (tab.isDirty) {
      const dirtyEl = document.createElement("span");
      dirtyEl.className = "tab-dirty";
      tabEl.appendChild(dirtyEl);
    }

    const closeEl = document.createElement("button");
    closeEl.className = "tab-close";
    closeEl.innerHTML = `
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    closeEl.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    tabEl.appendChild(closeEl);

    tabEl.addEventListener("click", () => {
      setActiveTab(tab.id);
    });

    tabEl.addEventListener("contextmenu", (e) => {
      showContextMenu(e, tab.id);
    });

    container.appendChild(tabEl);
  });
}

export function hasTabs(): boolean {
  return tabs.length > 0;
}

export function getActiveTabIndex(): number {
  if (!activeTabId) return 0;
  const index = tabs.findIndex((t) => t.id === activeTabId);
  return index >= 0 ? index : 0;
}

export async function closeAllTabs(): Promise<void> {
  // Collect all dirty tabs
  const dirtyTabs = tabs.filter((t) => t.isDirty);

  if (dirtyTabs.length > 0) {
    const electron = (window as any).electron;
    const message = dirtyTabs.length === 1
      ? `Do you want to save changes to "${dirtyTabs[0].fileName}"?`
      : `Do you want to save changes to ${dirtyTabs.length} unsaved files?`;

    const result = await electron.showConfirmDialog(
      message,
      "Your changes will be lost if you don't save them."
    );

    if (result === 1) {
      // Cancel
      return;
    }

    // result === 0: Don't Save - continue closing
    // result === 2: Save - for now just mark them clean (caller handles saving)
    if (result === 2) {
      // Mark all tabs as clean to avoid individual prompts
      // Caller is responsible for actually saving
      return;
    }
  }

  // Clear all tabs
  tabs = [];
  activeTabId = null;
  renderTabs();
  onTabChange?.(null);
  onTabsUpdate?.([]);
}

export async function closeOtherTabs(keepTabId: string): Promise<void> {
  const keepTab = getTab(keepTabId);
  if (!keepTab) return;

  // Collect dirty tabs that will be closed
  const dirtyTabs = tabs.filter((t) => t.id !== keepTabId && t.isDirty);

  if (dirtyTabs.length > 0) {
    const electron = (window as any).electron;
    const message = dirtyTabs.length === 1
      ? `Do you want to save changes to "${dirtyTabs[0].fileName}"?`
      : `Do you want to save changes to ${dirtyTabs.length} unsaved files?`;

    const result = await electron.showConfirmDialog(
      message,
      "Your changes will be lost if you don't save them."
    );

    if (result === 1) {
      // Cancel
      return;
    }

    // result === 0: Don't Save - continue closing
    // result === 2: Save - for now just discard (caller handles saving)
    if (result === 2) {
      return;
    }
  }

  // Keep only the specified tab
  tabs = [keepTab];
  activeTabId = keepTabId;
  renderTabs();
  onTabChange?.(keepTab);
  onTabsUpdate?.(tabs);
}
