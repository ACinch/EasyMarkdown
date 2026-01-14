# EasyMarkdown

A simple, cross-platform markdown editor built with Electron.

## Project Overview

A lightweight markdown editor that allows users to:
- Edit markdown files with both raw text and WYSIWYG editing
- Preview formatted markdown with dark mode support
- Manage multiple files via a tabbed interface
- Quick-access recent files from the application menu
- Format text using a command bar
- Drag-and-drop files to open them
- Auto-update from GitHub releases

## Technology Stack

- **Electron** 28.x - Cross-platform desktop application framework
- **TypeScript** - All source code
- **Milkdown** - WYSIWYG markdown editor (ProseMirror-based)
- **Tailwind CSS** - Utility-first CSS framework
- **esbuild** - Renderer bundling
- **electron-builder** - Packaging & auto-updates
- **pnpm** - Package manager

## Project Structure

```
osxmd/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # App lifecycle, IPC handlers
│   │   ├── menu.ts        # Application menu
│   │   ├── store.ts       # Recent files storage
│   │   └── updater.ts     # Auto-update logic
│   ├── preload/
│   │   └── preload.ts     # IPC bridge (contextBridge)
│   └── renderer/          # UI (runs in browser context)
│       ├── renderer.ts    # Main orchestrator
│       ├── editor.ts      # Raw textarea editor
│       ├── wysiwyg.ts     # Milkdown WYSIWYG editor
│       ├── tabs.ts        # Tab management
│       ├── commandbar.ts  # Formatting toolbar
│       ├── imagedialog.ts # Image insertion dialog
│       ├── styles.css     # Tailwind + custom styles
│       └── index.html
├── dist/                  # Compiled output + packages
├── assets/                # App icons
├── scripts/
│   └── build-renderer.js  # esbuild config for renderer
└── package.json           # Dependencies & build config
```

## Current Features (v0.1.7)

### 1. Dual Editing Modes
- **Raw mode**: Textarea-based markdown editing
- **Preview mode**: WYSIWYG editing with Milkdown
- Toggle with `Cmd+P` or toolbar button
- Content syncs bidirectionally between modes

### 2. Dark Mode
- Toggle with moon icon button or `Cmd+D`
- Auto-detects system theme preference on startup
- Syncs when system theme changes
- Applies to preview/WYSIWYG mode

### 3. Tabbed Interface
- Multiple files open simultaneously
- Dirty state indicator (unsaved changes)
- Close tab with unsaved changes prompt

### 4. Command Bar
Works in both raw and WYSIWYG modes:
- Bold (`Cmd+B`), Italic (`Cmd+I`)
- Headings H1-H3 (`Cmd+1/2/3`)
- Code inline and block
- Links (`Cmd+K`), Images (dialog)
- Lists (bulleted & numbered), Blockquotes

### 5. File Operations
- **New**: `Cmd+N`
- **Open**: `Cmd+O`
- **Save**: `Cmd+S`
- **Save As**: `Cmd+Shift+S`
- **Close Tab**: `Cmd+W`
- Recent files menu
- Drag-and-drop .md files to open

### 6. Auto-Update
- Checks GitHub releases on startup
- Downloads and installs updates
- Manual check via menu ("Check for Updates...")

## Component Responsibilities

### Main Process (`src/main/`)
- **main.ts**: Window creation, app lifecycle, file dialogs, IPC handlers
- **menu.ts**: Native menu bar with File, Edit, Format, View, Window, Help
- **store.ts**: JSON-based storage for recent files list
- **updater.ts**: electron-updater integration for auto-updates

### Preload Script (`src/preload/`)
- **preload.ts**: Secure context bridge exposing file operations and IPC to renderer

### Renderer Process (`src/renderer/`)
- **renderer.ts**: Main orchestrator, state management, mode switching, dark mode
- **editor.ts**: Textarea-based raw editor with text manipulation functions
- **wysiwyg.ts**: Milkdown WYSIWYG editor wrapper with formatting commands
- **tabs.ts**: Tab bar with add/close/switch functionality, dirty state tracking
- **commandbar.ts**: Toolbar buttons, delegates to editor or wysiwyg based on mode
- **imagedialog.ts**: Modal for inserting images (URL or local file)

## Key Implementation Details

### Dependencies
Runtime dependencies (in `dependencies`, not `devDependencies`) are required for the packaged app:
- `electron-updater` and ALL its transitive deps must be listed explicitly
- Current runtime deps: electron-updater, fs-extra, graceful-fs, jsonfile, universalify, builder-util-runtime, lazy-val, semver, debug, ms, sax, js-yaml, argparse, lodash.escaperegexp, lodash.isequal, tiny-typed-emitter

### Build Configuration
- `files` in package.json lists specific folders to avoid bundling old artifacts:
  ```json
  "files": [
    "dist/main/**/*",
    "dist/preload/**/*",
    "dist/renderer/**/*",
    "assets/**/*"
  ]
  ```
- Renderer is bundled by esbuild into single file (includes Milkdown)
- Bundled renderer deps go in `devDependencies` (Milkdown, marked, highlight.js)

### IPC Pattern
Main ↔ Renderer communication via preload script with contextBridge:
- Main sends events: `file:new`, `file:open-path`, `view:toggle`, `view:toggle-dark`, `format:apply`
- Renderer invokes: `file:read`, `file:save`, `file:save-dialog`, `file:open-dialog`, `dialog:confirm`

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
| 0.1.7   | Dark mode with system theme detection |
| 0.1.6   | Fixed all electron-updater runtime dependencies |
| 0.1.4-5 | Auto-update support (had missing deps) |
| 0.1.3   | WYSIWYG editing with Milkdown, drag-and-drop files |
| 0.1.2   | Bug fixes, app icon |
| 0.1.1   | Image picker for URLs or files, cross-platform support |

## State Management

Application state is managed in the renderer process:

```typescript
type ViewMode = "raw" | "preview";
let viewMode: ViewMode = "raw";
let darkMode: boolean = false;  // Initialized from system preference

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
