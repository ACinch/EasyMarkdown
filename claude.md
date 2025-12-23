# OSX Markdown Editor

A simple Electron-based markdown editor for macOS.

## Project Overview

A lightweight markdown editor that allows users to:
- Edit markdown files with raw text editing
- Preview formatted markdown in real-time
- Manage multiple files via a tabbed interface
- Quick-access recent files from the application menu
- Format text using a command bar

## Architecture

### Technology Stack
- **Electron** - Cross-platform desktop application framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **pnpm** - Fast, disk space efficient package manager
- **marked** - Markdown parsing library
- **highlight.js** - Syntax highlighting for code blocks in preview

### Project Structure

```
osxmd/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── claude.md
├── src/
│   ├── main/
│   │   ├── main.ts           # Electron main process
│   │   ├── menu.ts           # Application menu with recent files
│   │   └── store.ts          # Persistent storage for recent files
│   ├── preload/
│   │   └── preload.ts        # Secure IPC bridge
│   └── renderer/
│       ├── index.html        # Main window HTML
│       ├── styles.css        # Tailwind imports + custom styles
│       ├── renderer.ts       # Main renderer logic
│       ├── tabs.ts           # Tab management
│       ├── editor.ts         # Text editor component
│       ├── preview.ts        # Markdown preview component
│       └── commandbar.ts     # Formatting command bar
├── dist/                     # Compiled TypeScript output
└── assets/
    └── icons/                # Application icons
```

### Component Responsibilities

#### Main Process (`src/main/`)
- **main.ts**: Window creation, app lifecycle, file dialogs, IPC handlers
- **menu.ts**: Native menu bar with File, Edit, View, and recent files submenu
- **store.ts**: JSON-based storage for user preferences and recent files list

#### Preload Script (`src/preload/`)
- **preload.ts**: Secure context bridge exposing file operations to renderer

#### Renderer Process (`src/renderer/`)
- **renderer.ts**: Orchestrates UI components, handles state
- **tabs.ts**: Tab bar with add/close/switch functionality, tracks dirty state
- **editor.ts**: Textarea-based editor with line numbers
- **preview.ts**: Renders markdown to HTML using marked
- **commandbar.ts**: Toolbar buttons for bold, italic, headers, links, etc.

## Key Features

### 1. Tabbed Interface
- Each open file is a separate tab
- New tabs can be created for unsaved documents
- Tabs show filename and dirty indicator (*)
- Close button on each tab with unsaved changes prompt

### 2. Editor Modes
- **Raw Mode**: Plain text editing with monospace font
- **Preview Mode**: Rendered markdown (read-only)
- Toggle between modes via View menu or keyboard shortcut

### 3. Command Bar
Formatting buttons that insert markdown syntax:
- Bold (`**text**`)
- Italic (`*text*`)
- Headers (H1-H3)
- Link (`[text](url)`)
- Image (`![alt](url)`)
- Code (inline and block)
- Lists (ordered and unordered)
- Blockquote

### 4. Recent Files
- Stored in user data directory as JSON
- Maximum 10 recent files
- Displayed in File menu submenu
- Click to open file in new tab

### 5. File Operations
- **New**: Create empty tab (Cmd+N)
- **Open**: File dialog for .md files (Cmd+O)
- **Save**: Save current tab (Cmd+S)
- **Save As**: Save with new name (Cmd+Shift+S)

## IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `file:open` | main→renderer | Send file content to renderer |
| `file:save` | renderer→main | Request file save |
| `file:save-as` | renderer→main | Request save as dialog |
| `file:new` | main→renderer | Create new tab |
| `file:content` | renderer→main | Send content for saving |
| `recent:get` | renderer→main | Request recent files list |
| `recent:list` | main→renderer | Send recent files list |
| `menu:format` | main→renderer | Apply formatting command |

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm start

# Build TypeScript
pnpm build

# Build CSS (Tailwind)
pnpm build:css

# Package for distribution
pnpm package
```

## TypeScript Configuration

The project uses separate tsconfig files:
- Main process compiled to CommonJS for Electron compatibility
- Preload script with DOM types disabled
- Renderer with DOM types enabled

## Tailwind Setup

Tailwind is used for:
- Tab bar styling with hover/active states
- Command bar button styling
- Editor and preview pane layout
- Responsive spacing and typography

Custom Tailwind config extends with:
- Monospace font family for editor
- Custom colors matching macOS aesthetic
- Prose styles for markdown preview

## Coding Conventions

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use ES modules (`import`/`export`)
- Prefer `const` over `let`, avoid `var`
- Use async/await for asynchronous operations
- Keep functions small and focused

## State Management

Application state is managed in the renderer process:

```typescript
interface Tab {
  id: string;           // Unique tab identifier
  filePath: string | null; // Full path or null for new files
  fileName: string;     // Display name
  content: string;      // Current editor content
  savedContent: string; // Last saved content (for dirty check)
  isDirty: boolean;     // Has unsaved changes
}

interface AppState {
  tabs: Tab[];
  activeTabId: string | null;
  viewMode: 'raw' | 'preview';
}
```

## Security Considerations

- Context isolation enabled
- Node integration disabled in renderer
- All file operations go through preload script
- File paths validated in main process
