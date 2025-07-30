# Export Files Extension

A VS Code extension that exports project files to a single markdown document with comprehensive formatting and statistics.

## Features

- **One-click export**: Right-click any folder in the VS Code explorer and export all its files to markdown
- **Smart filtering**: Automatically ignores common directories (node_modules, .git, build, etc.) and binary files
- **Directory structure**: Includes a visual tree structure of your project
- **File statistics**: Shows file count, total size, and breakdown by file type
- **Syntax highlighting**: All exported code maintains proper syntax highlighting in markdown
- **Configurable**: Customize ignore patterns, file size limits, and output options
- **Recursive scanning**: Optionally scan subdirectories or stay at the current level

## Usage

1. Right-click on any folder in the VS Code Explorer
2. Select "exportToMarkdown" from the context menu
3. The extension will create a markdown file with all your project files

The generated markdown includes:
- Export timestamp and source directory information
- Directory structure visualization
- File statistics and type distribution
- Complete file contents with syntax highlighting

## Configuration

This extension provides several configuration options in VS Code settings:

### `exportFiles.ignore`
- **Type**: Array of strings
- **Default**: `["node_modules", ".git", ".next", "dist", "build", "coverage", ...]`
- **Description**: List of directories and files to ignore during export

### `exportFiles.ignoreExtensions`
- **Type**: Array of strings  
- **Default**: `[".jpg", ".png", ".pdf", ".zip", ".exe", ...]`
- **Description**: List of file extensions to ignore (typically binary files)

### `exportFiles.outputFile`
- **Type**: String
- **Default**: `"project-files.md"`
- **Description**: Default filename for the exported markdown file

### `exportFiles.recursive`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Whether to recursively scan subdirectories

### `exportFiles.includeStructure`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Whether to include directory structure in the output

### `exportFiles.includeStats`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Whether to include file statistics in the output

### `exportFiles.maxFileSize`
- **Type**: Number
- **Default**: `1048576` (1MB)
- **Description**: Maximum file size in bytes. Files larger than this will be skipped. Set to 0 for no limit.

## Example Output

The generated markdown file will look like this:

```markdown
# Project Files Export

Export time: 12/20/2024, 3:45:23 PM
Source directory: `my-project`
Output file: `project-files.md`

## Directory Structure

```
my-project
├── src/
│   ├── components/
│   │   └── Button.tsx
│   └── utils/
│       └── helpers.ts
├── package.json
└── README.md
```

## File Statistics

- Total files: 4
- Total size: 12.3 KB

### File Type Distribution

| Extension | Files | Total Size |
| --- | --- | --- |
| .ts | 2 | 8.1 KB |
| .json | 1 | 3.2 KB |
| .md | 1 | 1.0 KB |

## File Contents

### src/components/Button.tsx

```tsx
// src/components/Button.tsx
import React from 'react';

export const Button = () => {
  return <button>Click me</button>;
};
```
```

## Requirements

- VS Code version 1.102.0 or higher
- No additional dependencies required

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Export Files Extension"
4. Click Install

Or install from the command line:
```bash
code --install-extension export-files-extension
```

## Use Cases

- **Documentation**: Generate comprehensive project documentation for sharing
- **Code reviews**: Export specific folders for detailed code review
- **AI assistance**: Prepare project context for AI tools like ChatGPT or Claude
- **Backup**: Create readable backups of your codebase
- **Analysis**: Get insights into your project structure and file distribution

## Known Issues

- Very large files (>1MB by default) are skipped to prevent memory issues
- Binary files are automatically ignored but may need manual configuration for edge cases
- Unicode characters in file paths may not display correctly in some markdown viewers

## Release Notes

### 0.0.1

Initial release featuring:
- Basic file export functionality
- Directory structure visualization
- File statistics and type breakdown
- Configurable ignore patterns
- Context menu integration

## Contributing

This extension is open source. Feel free to contribute by:
- Reporting bugs or feature requests
- Submitting pull requests
- Improving documentation

## License

[MIT License](LICENSE)

---

**Enjoy exporting your projects!** 🚀