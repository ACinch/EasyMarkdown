# EasyMarkdown

A simple, cross-platform markdown editor built with Electron.

![EasyMarkdown](https://github.com/ACinch/EasyMarkdown/blob/main/osxmd.png)

## Features

- **Syntax Highlighting** - CodeMirror-powered editor with markdown highlighting
- **Split View** - Edit and preview side-by-side with resizable panes
- **WYSIWYG Mode** - Rich text editing with Milkdown
- **Tabbed Interface** - Open multiple markdown files in separate tabs
- **Document Outline** - Navigate headings in a collapsible sidebar
- **Find & Replace** - Search and replace text with regex support
- **Export** - Export documents as PDF or HTML
- **Table Editor** - Visual dialog for creating markdown tables
- **Theme Customization** - Light/Dark/Custom colors for text, background, headings
- **Session Restore** - Reopens previous tabs on launch
- **Auto-save** - Automatically save changes at configurable intervals
- **Focus Mode** - Distraction-free writing environment
- **Auto-Update** - Automatic updates from GitHub releases

## Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| New File | Cmd+N | Ctrl+N |
| Open File | Cmd+O | Ctrl+O |
| Save | Cmd+S | Ctrl+S |
| Save As | Cmd+Shift+S | Ctrl+Shift+S |
| Close Tab | Cmd+W | Ctrl+W |
| Close All Tabs | Cmd+Shift+W | Ctrl+Shift+W |
| Find | Cmd+F | Ctrl+F |
| Replace | Cmd+H | Ctrl+H |
| Toggle View Mode | Cmd+P | Ctrl+P |
| Split View | Cmd+\ | Ctrl+\ |
| Toggle Outline | Cmd+Shift+O | Ctrl+Shift+O |
| Focus Mode | Cmd+Shift+Enter | Ctrl+Shift+Enter |
| Export as PDF | Cmd+Shift+E | Ctrl+Shift+E |
| Settings | Cmd+, | Ctrl+, |
| Bold | Cmd+B | Ctrl+B |
| Italic | Cmd+I | Ctrl+I |
| Heading 1/2/3 | Cmd+1/2/3 | Ctrl+1/2/3 |
| Inline Code | Cmd+` | Ctrl+` |
| Code Block | Cmd+Shift+` | Ctrl+Shift+` |
| Link | Cmd+K | Ctrl+K |
| Insert Table | Cmd+T | Ctrl+T |
| Bulleted List | Cmd+Shift+8 | Ctrl+Shift+8 |
| Numbered List | Cmd+Shift+7 | Ctrl+Shift+7 |
| Blockquote | Cmd+Shift+. | Ctrl+Shift+. |

## Settings

Access settings via the menu (EasyMarkdown → Settings on macOS, Edit → Settings on Windows/Linux) or `Cmd/Ctrl+,`:

- **Font Size** - 12px to 24px
- **Font Family** - Monospace, System, Sans-serif, Serif
- **Theme Colors** - Customize text, background, heading, and table header colors
  - Light/Dark presets or custom color picker
- **Auto-save** - Enable with configurable interval (15s to 5min)
- **Spell Check** - Toggle spell checking

## Installation

Download the latest release for your platform from the [Releases](https://github.com/ACinch/EasyMarkdown/releases) page.

### macOS
- Download the `.dmg` file
- Open and drag EasyMarkdown to Applications

### Windows
- Download the `.exe` installer
- Run and follow the installation wizard

### Linux
- Download the `.AppImage` file
- Make it executable: `chmod +x EasyMarkdown-*.AppImage`
- Run: `./EasyMarkdown-*.AppImage`

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Start the application
pnpm start

# Build TypeScript and CSS
pnpm build

# Package for distribution
pnpm package:mac      # macOS
pnpm package:win      # Windows
pnpm package:linux    # Linux
pnpm package:all      # All platforms
```

## Tech Stack

- **Electron** - Desktop application framework
- **TypeScript** - Type-safe JavaScript
- **CodeMirror 6** - Syntax highlighting editor
- **Milkdown** - WYSIWYG markdown editor
- **Tailwind CSS** - Utility-first styling
- **marked** - Markdown parsing
- **highlight.js** - Syntax highlighting for code blocks
- **electron-builder** - Packaging and auto-updates

## License

MIT
