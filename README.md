# Nemui API Client

A powerful REST & GraphQL API client that works both as a VSCode extension and a standalone web application.

## Packages

| Package | Description |
|---------|-------------|
| `@nemui/core` | Shared business logic (store, HTTP client, types) |
| `@nemui/standalone` | Standalone web app |
| `@nemui/vscode` | VSCode extension |

## Development

### Install Dependencies

```bash
npm install
```

### Standalone App (Web)

```bash
# Development
npm run dev:standalone

# Build
npm run build:standalone

# Output: packages/standalone/dist/
```

### VSCode Extension

```bash
# Development (open in VSCode and press F5)
npm run dev:vscode

# Build
npm run build:vscode

# Package (.vsix)
npm run package:vscode
```

## Building Both

```bash
npm run build
```

This will build both the standalone app and the VSCode extension.

## Architecture

```
nemui/
├── packages/
│   ├── core/          # Shared code
│   │   └── src/
│   │       ├── types.ts
│   │       ├── store.ts
│   │       └── httpClient.ts
│   ├── standalone/   # Web app
│   │   └── src/
│   │       ├── App.tsx
│   │       └── components/
│   └── vscode/       # VSCode extension
│       └── src/
│           ├── extension.ts
│           └── commands/
```

## Features

- REST & GraphQL requests
- Environments & variables
- Pre/Post request scripts
- Import/Export (Insomnia, Postman)
- Collections organization

## License

MIT
