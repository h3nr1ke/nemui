# Nemui API Client

A REST & GraphQL API client for VSCode - Like Insomnia but inside your editor.

## Features

- ✅ REST API requests (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- ✅ GraphQL support
- ✅ Headers and Query Parameters
- ✅ Request Body (JSON, Form Data, Raw, GraphQL)
- ✅ Response viewer with syntax highlighting
- ✅ Collections organization in sidebar
- ✅ Environment variables (coming soon)
- ✅ Authentication (Bearer, Basic, API Key) (coming soon)

## Development

### Prerequisites

- Node.js 18+
- VSCode 1.85+

### Setup

```bash
# Install root dependencies
npm install

# Build the webview
cd webview && npm install && npm run build

# Return to root and compile TypeScript
cd ..
npm run compile
```

### Running in Development

Press F5 to launch the extension in a new VSCode window.

### Building

```bash
npm run package
```

This will create a `.vsix` file that can be installed in VSCode.

## Project Structure

```
project-nemui/
├── src/
│   ├── extension.ts       # Main entry point
│   ├── commands/         # VSCode commands
│   ├── providers/        # Tree view providers
│   ├── utils/            # Panel and helpers
│   └── types.ts          # TypeScript types
├── webview/              # React webview
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── stores/       # Zustand stores
│   │   └── styles/       # CSS styles
│   └── package.json
├── package.json
└── tsconfig.json
```

## Usage

1. Open VSCode
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Open API Client" and select the command
4. Or click on the "API Collections" in the Explorer sidebar
5. Enter your API URL, add headers/body as needed
6. Click "Send Request" or press `Ctrl+Enter`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send Request |
| `Cmd+Enter` (Mac) | Send Request |

## License

MIT
