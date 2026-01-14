# EasyMarkdown

A simple, cross-platform markdown editor built with Electron.

## Project Overview

A lightweight markdown editor that allows users to:
- Edit markdown files with syntax highlighting (CodeMirror 6)
- Preview formatted markdown with WYSIWYG editing (Milkdown)
- Split view with resizable panes
- Manage multiple files via a tabbed interface
- Customize theme colors (foreground, background, headings, table headers)
- Find and replace text
- Export to PDF and HTML
- Create tables with a visual editor
- Auto-save and session restore
- Auto-update from GitHub releases

## Technology Stack

- **Electron** 28.x - Cross-platform desktop application framework
- **TypeScript** - All source code
- **CodeMirror 6** - Syntax highlighted raw editor
- **Milkdown** - WYSIWYG markdown editor (ProseMirror-based)
- **Tailwind CSS** - Utility-first CSS framework
- **esbuild** - Renderer bundling
- **electron-builder** - Packaging & auto-updates
- **pnpm** - Package manager

## Project Structure

```
osxmd/
├── src/
│   ├── main/                # Electron main process
│   │   ├── main.ts          # App lifecycle, IPC handlers, PDF export
│   │   ├── menu.ts          # Application menu
│   │   ├── store.ts         # Settings & session storage
│   │   └── updater.ts       # Auto-update logic
│   ├── preload/
│   │   └── preload.ts       # IPC bridge (contextBridge)
│   └── renderer/            # UI (runs in browser context)
│       ├── renderer.ts      # Main orchestrator, state management
│       ├── editor.ts        # CodeMirror 6 editor with syntax highlighting
│       ├── wysiwyg.ts       # Milkdown WYSIWYG editor
│       ├── tabs.ts          # Tab management with context menu
│       ├── commandbar.ts    # Formatting toolbar
│       ├── findreplace.ts   # Find & replace functionality
│       ├── statusbar.ts     # Word count, cursor position
│       ├── outline.ts       # Document outline panel
│       ├── export.ts        # PDF/HTML export
│       ├── tabledialog.ts   # Table creation dialog
│       ├── imagedialog.ts   # Image insertion dialog
│       ├── settingsdialog.ts # Settings UI
│       ├── styles.css       # Tailwind + custom styles
│       └── index.html
├── dist/                    # Compiled output + packages
├── assets/                  # App icons
├── scripts/
│   └── build-renderer.js    # esbuild config for renderer
└── package.json             # Dependencies & build config
```

## Current Features (v0.1.9)

### 1. Editor Modes
- **Raw mode**: CodeMirror 6 with markdown syntax highlighting
- **Split mode**: Side-by-side raw editor and WYSIWYG preview
- **Preview mode**: Full WYSIWYG editing with Milkdown
- Cycle through modes with `Cmd+P` or toolbar button
- Content syncs bidirectionally between modes

### 2. Theme Customization
- Configurable colors: foreground, background, headings, table headers
- Light/Dark/Custom presets for each color
- Dynamic theme updates (no restart required)
- CodeMirror theme updates via compartments

### 3. Tabbed Interface
- Multiple files open simultaneously
- Dirty state indicator (unsaved changes)
- Close tab with unsaved changes prompt
- Close All / Close Others via context menu
- Session restore on app launch

### 4. Document Outline
- Collapsible sidebar showing document headings
- Click to navigate to heading
- Toggle with `Cmd+Shift+O`

### 5. Find & Replace
- Find with `Cmd+F`, Replace with `Cmd+H`
- Match highlighting and navigation
- Replace one or all matches

### 6. Export
- Export to HTML with full styling
- Export to PDF via Electron's printToPDF
- Preserves current theme settings

### 7. Command Bar
Works in all modes:
- Bold (`Cmd+B`), Italic (`Cmd+I`)
- Headings H1-H3 (`Cmd+1/2/3`)
- Code inline and block
- Links (`Cmd+K`), Images (dialog)
- Tables (`Cmd+T`) with visual editor
- Lists (bulleted & numbered), Blockquotes

### 8. Status Bar
- Word count
- Character count
- Cursor position (line, column)

### 9. Settings
- Font size (12-24px)
- Font family (with preview in dropdown)
- Theme colors with Light/Dark/Custom presets
- Auto-save with configurable interval
- Spell check toggle
- Settings migration for version upgrades

### 10. Focus Mode
- Hides tab bar, command bar, status bar, outline
- Full-screen distraction-free editing
- Exit with `Escape` or `Cmd+Shift+Enter`

### 11. Auto-Update
- Checks GitHub releases on startup
- Downloads and installs updates
- Manual check via menu

## Component Responsibilities

### Main Process (`src/main/`)
- **main.ts**: Window creation, app lifecycle, file dialogs, IPC handlers, PDF export
- **menu.ts**: Native menu bar with File, Edit, Format, View, Window, Help
- **store.ts**: JSON-based storage for settings, recent files, session
- **updater.ts**: electron-updater integration for auto-updates

### Preload Script (`src/preload/`)
- **preload.ts**: Secure context bridge exposing file operations and IPC to renderer

### Renderer Process (`src/renderer/`)
- **renderer.ts**: Main orchestrator, state management, mode switching, theme application
- **editor.ts**: CodeMirror 6 with markdown highlighting, dynamic theming via compartments
- **wysiwyg.ts**: Milkdown WYSIWYG editor wrapper with formatting commands
- **tabs.ts**: Tab bar with context menu, dirty state, session management
- **commandbar.ts**: Toolbar buttons, delegates to editor based on mode
- **findreplace.ts**: Find bar UI, match navigation, replace functionality
- **statusbar.ts**: Word/char count, cursor position display
- **outline.ts**: Heading extraction, tree rendering, scroll-to navigation
- **export.ts**: HTML generation, PDF export via main process
- **tabledialog.ts**: Table size picker, preview grid, markdown generation
- **settingsdialog.ts**: Settings form, theme color presets, font preview

## Key Implementation Details

### CodeMirror 6 Theming
Dynamic theme updates using compartments:
```typescript
const themeCompartment = new Compartment();
const highlightCompartment = new Compartment();

// Update theme at runtime
editorView.dispatch({
  effects: [
    themeCompartment.reconfigure(createEditorTheme(fg, bg)),
    highlightCompartment.reconfigure(syntaxHighlighting(createMarkdownHighlighting(headingColor))),
  ],
});
```

### Settings Structure
```typescript
interface ThemeSettings {
  foreground: { preset: "light" | "dark" | "custom"; custom: string };
  background: { preset: "light" | "dark" | "custom"; custom: string };
  heading: { preset: "light" | "dark" | "custom"; custom: string };
  tableHeader: { preset: "light" | "dark" | "custom"; custom: string };
}

interface Settings {
  fontSize: number;
  fontFamily: string;
  theme: ThemeSettings;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
}
```

### IPC Pattern
Main ↔ Renderer communication via preload script with contextBridge:
- Main sends events: `file:new`, `file:open-path`, `view:toggle`, `format:apply`, `export:html`, `export:pdf`
- Renderer invokes: `file:read`, `file:save`, `export:dialog`, `export:pdf`, `settings:get`, `session:save`

### Dependencies
Runtime dependencies (in `dependencies`) required for packaged app:
- `electron-updater` and all transitive deps
- Current: electron-updater, fs-extra, graceful-fs, jsonfile, universalify, builder-util-runtime, lazy-val, semver, debug, ms, sax, js-yaml, argparse, lodash.escaperegexp, lodash.isequal, tiny-typed-emitter

Bundled deps (in `devDependencies`, bundled by esbuild):
- CodeMirror packages, Milkdown, marked, highlight.js

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm start            # Dev: build & run
pnpm build            # Build TypeScript & CSS
pnpm package:mac      # Package for macOS
pnpm package:win      # Package for Windows
pnpm package:linux    # Package for Linux
pnpm package:all      # Package all platforms
```

## GitHub & Releases

- **Repository**: https://github.com/ACinch/EasyMarkdown
- **Auto-update**: Pulls from GitHub releases
- **Publish config**:
  ```json
  "publish": {
    "provider": "github",
    "owner": "ACinch",
    "repo": "EasyMarkdown"
  }
  ```

## Version History

| Version | Key Changes |
|---------|-------------|
| 0.1.9   | Theme settings, syntax highlighting (CodeMirror 6), export PDF/HTML, table editor, find/replace, split view, outline, focus mode, session restore, auto-save |
| 0.1.8   | Settings dialog for font and colors |
| 0.1.7   | Dark mode with system theme detection |
| 0.1.6   | Fixed all electron-updater runtime dependencies |
| 0.1.4-5 | Auto-update support |
| 0.1.3   | WYSIWYG editing with Milkdown, drag-and-drop files |
| 0.1.2   | Bug fixes, app icon |
| 0.1.1   | Image picker, cross-platform support |

## State Management

Application state in renderer process:
```typescript
type ViewMode = "raw" | "preview" | "split";
let viewMode: ViewMode = "raw";
let focusMode: boolean = false;
let currentSettings: Settings | null = null;

interface Tab {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  savedContent: string;
  isDirty: boolean;
}
```

## Security Considerations

- Context isolation enabled
- Node integration disabled in renderer
- All file operations go through preload script
- File paths validated in main process

## Coding Conventions

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use ES modules (`import`/`export`)
- Prefer `const` over `let`, avoid `var`
- Use async/await for asynchronous operations
- Keep functions small and focused
