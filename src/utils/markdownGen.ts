import * as path from "path";
import { FileInfo, ExportConfig } from "./fileUtils";

export class MarkdownGenerator {
  private getLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: { [key: string]: string } = {
      ".js": "javascript",
      ".jsx": "jsx",
      ".ts": "typescript",
      ".tsx": "tsx",
      ".html": "html",
      ".css": "css",
      ".scss": "scss",
      ".json": "json",
      ".md": "markdown",
      ".py": "python",
      ".java": "java",
      ".c": "c",
      ".cpp": "cpp",
      ".go": "go",
      ".rs": "rust",
      ".php": "php",
      ".sh": "bash",
      ".sql": "sql",
      ".xml": "xml",
      ".yaml": "yaml",
      ".yml": "yaml",
    };
    return languageMap[ext] || "plaintext";
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async generateMarkdown(
    basePath: string,
    files: FileInfo[],
    outputFileName: string,
    config: ExportConfig,
    directoryStructure?: string
  ): Promise<string> {
    let content = `# Project Files Export\n\n`;
    content += `Export time: ${new Date().toLocaleString()}\n\n`;
    content += `Source directory: \`${path.basename(basePath)}\`\n\n`;
    content += `Output file: \`${outputFileName}\`\n\n`;

    // Add directory structure
    if (config.includeStructure && directoryStructure) {
      content += `## Directory Structure\n\n`;
      content += `\`\`\`\n`;
      content += `${path.basename(basePath)}\n`;
      content += directoryStructure;
      content += `\n\`\`\`\n\n`;
    }

    // File statistics
    if (config.includeStats) {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const extensionStats: { [key: string]: { count: number; size: number } } =
        {};

      files.forEach((file) => {
        const ext = file.extension || "(no extension)";
        if (!extensionStats[ext]) {
          extensionStats[ext] = { count: 0, size: 0 };
        }
        extensionStats[ext].count++;
        extensionStats[ext].size += file.size;
      });

      content += `## File Statistics\n\n`;
      content += `- Total files: ${files.length}\n`;
      content += `- Total size: ${this.formatFileSize(totalSize)}\n\n`;

      // File type distribution
      if (Object.keys(extensionStats).length > 0) {
        content += `### File Type Distribution\n\n`;
        content += `| Extension | Files | Total Size |\n`;
        content += `| --- | --- | --- |\n`;

        Object.entries(extensionStats)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([ext, stats]) => {
            content += `| ${ext} | ${stats.count} | ${this.formatFileSize(
              stats.size
            )} |\n`;
          });

        content += `\n`;
      }
    }

    // File contents
    content += `## File Contents\n\n`;

    for (const file of files) {
      const language = this.getLanguage(file.path);
      content += `### ${file.relativePath}\n\n`;
      content += `\`\`\`${language}\n`;
      content += `// ${file.relativePath}\n`;
      content += file.content;
      content += `\n\`\`\`\n\n`;
    }

    return content;
  }
}
