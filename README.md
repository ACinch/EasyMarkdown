# OSX Markdown Editor

A simple, lightweight markdown editor for macOS built with Electron.

![OSXMD](https://github.com/ACinch/EasyMarkdown/blob/main/osxmd.png)

## Features

- **Tabbed Interface** - Open multiple markdown files in separate tabs
- **Raw/Preview Mode** - Toggle between editing and rendered preview
- **Command Bar** - Quick formatting buttons for common markdown syntax
- **Recent Files** - Access recently opened files from the File menu
- **Native macOS Look** - Hidden title bar with native menu integration

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New File | Cmd+N |
| Open File | Cmd+O |
| Save | Cmd+S |
| Save As | Cmd+Shift+S |
| Close Tab | Cmd+W |
| Toggle Preview | Cmd+P |
| Bold | Cmd+B |
| Italic | Cmd+I |
| Heading 1 | Cmd+1 |
| Heading 2 | Cmd+2 |
| Heading 3 | Cmd+3 |
| Inline Code | Cmd+` |
| Code Block | Cmd+Shift+` |
| Link | Cmd+K |

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Run the electron install script (required for first run)
node node_modules/.pnpm/electron@*/node_modules/electron/install.js
```

### Commands

```bash
# Start the application
pnpm start

# Build TypeScript and CSS
pnpm build

# Watch mode for development
pnpm dev

# Package for distribution
pnpm package
```

## Tech Stack

- **Electron** - Desktop application framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **marked** - Markdown parsing
- **highlight.js** - Syntax highlighting for code blocks

## Project Structure

```
osxmd/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # App entry, window management
│   │   ├── menu.ts     # Application menu
│   │   └── store.ts    # Recent files storage
│   ├── preload/        # IPC bridge
│   │   └── preload.ts  # Secure context bridge
│   └── renderer/       # UI components
│       ├── index.html  # Main window
│       ├── styles.css  # Tailwind styles
│       ├── renderer.ts # Main UI logic
│       ├── tabs.ts     # Tab management
│       ├── editor.ts   # Text editor
│       ├── preview.ts  # Markdown preview
│       └── commandbar.ts # Formatting toolbar
├── dist/               # Compiled output
├── package.json
├── tsconfig.*.json     # TypeScript configs
└── tailwind.config.js
```

## License

MIT
