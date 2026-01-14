# EasyMarkdown Feature Roadmap

## Overview
Plan and implement new features for EasyMarkdown. High and Medium priority items will be implemented; Lower priority items are planned for future reference.

---

## HIGH PRIORITY (Implement)

### 1. Find & Replace
**Shortcut:** `Cmd+F` (find), `Cmd+Shift+F` or `Cmd+H` (replace)

**Implementation:**
- New file: `src/renderer/findreplace.ts`
- Add find bar UI to `index.html` (below command bar, hidden by default)
- Functions: `showFind()`, `showReplace()`, `findNext()`, `findPrev()`, `replaceOne()`, `replaceAll()`
- Highlight matches in editor using selection or CSS
- Support regex toggle, case-sensitive toggle, whole word toggle
- Works in raw mode; in WYSIWYG mode, use Milkdown's built-in search or text search

**Files:** `findreplace.ts` (new), `index.html`, `renderer.ts`, `menu.ts`, `preload.ts`, `styles.css`

---

### 2. Word/Character Count
**Location:** Status bar at bottom of window

**Implementation:**
- Add status bar div to `index.html`
- New file: `src/renderer/statusbar.ts`
- Display: "X words | Y characters | Line Z, Col W"
- Update on content change via debounced callback
- Parse content: split on whitespace for words, `.length` for chars
- Track cursor position for line/column

**Files:** `statusbar.ts` (new), `index.html`, `renderer.ts`, `styles.css`

---

### 3. Split View
**Shortcut:** `Cmd+\` or View menu toggle

**Implementation:**
- Modify `#content` layout to support side-by-side
- Add view mode: `"raw" | "preview" | "split"`
- In split mode: show both `#editor-container` and `#preview-container`
- Sync scroll positions (optional)
- Preview updates on content change (debounced)

**Files:** `renderer.ts`, `index.html`, `styles.css`, `menu.ts`, `preload.ts`

---

### 4. Export to PDF/HTML
**Shortcut:** `Cmd+Shift+E` or File > Export

**Implementation:**
- Add "Export..." submenu to File menu with HTML and PDF options
- HTML export: Render markdown to HTML, wrap in full document with styles
- PDF export: Use Electron's `printToPDF` API on a hidden webview
- Show save dialog with appropriate filters
- Include current theme styles in export

**Files:** `menu.ts`, `main.ts`, `preload.ts`, `renderer.ts`, new `src/renderer/export.ts`

---

### 5. Auto-save
**Setting:** Toggle in Settings, with interval option

**Implementation:**
- Extend `Settings` interface: `autoSave: boolean`, `autoSaveInterval: number` (seconds)
- Add to settings dialog UI
- In `renderer.ts`: set up interval timer when enabled
- Auto-save only dirty tabs with existing file paths (not new untitled files)
- Show subtle indicator when auto-saving
- Clear/reset timer on manual save

**Files:** `store.ts`, `settingsdialog.ts`, `index.html`, `renderer.ts`

---

### 6. Session Restore
**Behavior:** Reopen previously open tabs on app launch

**Implementation:**
- Extend `StoreData`: `session: { tabs: SessionTab[], activeTabIndex: number }`
- `SessionTab`: `{ filePath: string, scrollPosition?: number }`
- Save session on app quit (via `before-quit` event or periodic save)
- Restore session in `renderer.ts` `init()` after `initTabs()`
- Only restore tabs with valid file paths (skip if file deleted)
- Option in settings to enable/disable session restore

**Files:** `store.ts`, `main.ts`, `preload.ts`, `renderer.ts`, `settingsdialog.ts`

---

### 7. Close All / Close Others
**Location:** Tab context menu and File menu

**Implementation:**
- Add to `tabs.ts`: `closeAllTabs()`, `closeOtherTabs(keepTabId)`
- Handle dirty tabs: collect all dirty tabs, show single confirmation dialog
- Add right-click context menu on tabs with: Close, Close Others, Close All
- Add to File menu: Close All Tabs
- Keyboard shortcuts: `Cmd+Shift+W` for Close All

**Files:** `tabs.ts`, `menu.ts`, `index.html` (context menu), `renderer.ts`, `styles.css`

---

## MEDIUM PRIORITY (Implement)

### 8. Document Outline with Expand/Collapse
**Location:** Left sidebar panel (toggleable)

**Implementation:**
- New file: `src/renderer/outline.ts`
- Add sidebar container to `index.html` (left of content area)
- Parse headings from markdown: regex `^#{1-6}\s+(.+)$`
- Build nested tree structure based on heading levels
- Render as expandable/collapsible tree (CSS + JS)
- Click heading to scroll editor to that position
- Toggle sidebar: `Cmd+Shift+O` or View menu
- Update outline on content change (debounced)
- Highlight current section based on cursor position

**Files:** `outline.ts` (new), `index.html`, `renderer.ts`, `styles.css`, `menu.ts`, `preload.ts`

---

### 9. Spell Check Toggle
**Setting:** Toggle in Settings

**Implementation:**
- Extend `Settings`: `spellCheck: boolean`
- Add checkbox to settings dialog
- Apply to textarea: `spellcheck` attribute
- For WYSIWYG: Milkdown/ProseMirror has spellcheck support via contenteditable

**Files:** `store.ts`, `settingsdialog.ts`, `index.html`, `renderer.ts`, `editor.ts`

---

### 10. Focus Mode
**Shortcut:** `Cmd+Shift+Enter` or View menu

**Implementation:**
- Hide: tab bar, command bar, status bar, outline (if visible)
- Maximize editor to full window
- Subtle escape hint overlay
- Press `Escape` to exit focus mode
- Store focus mode state (don't persist across sessions)

**Files:** `renderer.ts`, `styles.css`, `menu.ts`, `preload.ts`

---

### 11. Syntax Highlighting in Raw Mode
**Implementation:**
- Use CodeMirror or highlight overlay approach
- Highlight markdown syntax: headers, bold, italic, links, code, lists
- Apply subtle colors (not full IDE highlighting)
- Alternative: Use transparent overlay div with highlighted content behind textarea

**Approach:** Replace textarea with CodeMirror 6 for raw editing
- Provides syntax highlighting, better cursor handling, line numbers
- Keep it simple: markdown mode only
- Preserve existing functionality (content sync, formatting commands)

**Files:** `editor.ts` (major rewrite), `package.json` (add codemirror), `styles.css`

---

### 12. Table Editor
**Trigger:** Command bar button or `Cmd+T`

**Implementation:**
- New file: `src/renderer/tabledialog.ts`
- Modal dialog for creating/editing tables
- Grid input for rows/columns
- Generate markdown table syntax
- For existing tables: parse and allow editing (complex - phase 2)
- Initial version: insert new table only

**Files:** `tabledialog.ts` (new), `index.html`, `commandbar.ts`, `renderer.ts`, `styles.css`

---

## LOWER PRIORITY (Plan Only - Future Implementation)

### 13. Math/LaTeX Support
- Integrate KaTeX or MathJax
- Detect `$...$` (inline) and `$$...$$` (block) syntax
- Render in preview mode
- Add to Milkdown via plugin

### 14. Mermaid Diagrams
- Integrate Mermaid.js
- Detect ```mermaid code blocks
- Render diagrams in preview
- Add Milkdown plugin for WYSIWYG

### 15. Templates
- Store templates in user data directory
- Template picker on new file
- Include: Blank, Meeting Notes, README, Blog Post, etc.
- Allow user-created templates

### 16. Custom Themes
- Preset theme packages (colors, fonts)
- Theme selector in settings
- Include: Light, Dark, Sepia, Nord, Dracula, etc.
- Export/import themes

### 17. Keyboard Shortcut Customization
- Store custom shortcuts in settings
- UI to view and modify shortcuts
- Conflict detection
- Reset to defaults option

---

## Implementation Order (Recommended)

**Phase 1 - Core UX:**
1. Session Restore (improves daily workflow)
2. Close All / Close Others (quick wins)
3. Word/Character Count + Status Bar (foundation for other features)

**Phase 2 - Editing Features:**
4. Find & Replace
5. Auto-save
6. Spell Check Toggle

**Phase 3 - View Enhancements:**
7. Split View
8. Document Outline
9. Focus Mode

**Phase 4 - Advanced:**
10. Export to PDF/HTML
11. Syntax Highlighting (larger effort)
12. Table Editor

---

## Files Summary

| Feature | New Files | Modified Files |
|---------|-----------|----------------|
| Find & Replace | `findreplace.ts` | `index.html`, `renderer.ts`, `menu.ts`, `preload.ts`, `styles.css` |
| Word Count | `statusbar.ts` | `index.html`, `renderer.ts`, `styles.css` |
| Split View | - | `renderer.ts`, `index.html`, `styles.css`, `menu.ts`, `preload.ts` |
| Export | `export.ts` | `menu.ts`, `main.ts`, `preload.ts`, `renderer.ts` |
| Auto-save | - | `store.ts`, `settingsdialog.ts`, `index.html`, `renderer.ts` |
| Session Restore | - | `store.ts`, `main.ts`, `preload.ts`, `renderer.ts` |
| Close All/Others | - | `tabs.ts`, `menu.ts`, `index.html`, `renderer.ts` |
| Document Outline | `outline.ts` | `index.html`, `renderer.ts`, `styles.css`, `menu.ts`, `preload.ts` |
| Spell Check | - | `store.ts`, `settingsdialog.ts`, `renderer.ts`, `editor.ts` |
| Focus Mode | - | `renderer.ts`, `styles.css`, `menu.ts`, `preload.ts` |
| Syntax Highlight | - | `editor.ts`, `package.json`, `styles.css` |
| Table Editor | `tabledialog.ts` | `index.html`, `commandbar.ts`, `renderer.ts`, `styles.css` |

---

## Progress

- [x] Settings Menu (v0.1.8-beta)
- [x] Session Restore
- [x] Close All / Close Others
- [x] Word/Character Count + Status Bar
- [x] Find & Replace
- [x] Auto-save
- [x] Spell Check Toggle
- [x] Split View
- [x] Document Outline with Expand/Collapse
- [x] Focus Mode
- [ ] Export to PDF/HTML
- [ ] Syntax Highlighting
- [ ] Table Editor
