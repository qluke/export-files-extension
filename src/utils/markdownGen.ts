import * as path from "path";
import { FileInfo } from "./fileUtils";

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
    outputFileName: string
  ): Promise<string> {
    let content = `# 项目文件导出\n\n`;
    content += `导出时间: ${new Date().toLocaleString()}\n\n`;
    content += `源目录: \`${path.basename(basePath)}\`\n\n`;
    content += `输出文件: \`${outputFileName}\`\n\n`;

    // 文件统计
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const extensionStats: { [key: string]: { count: number; size: number } } =
      {};

    files.forEach((file) => {
      const ext = file.extension || "(无扩展名)";
      if (!extensionStats[ext]) {
        extensionStats[ext] = { count: 0, size: 0 };
      }
      extensionStats[ext].count++;
      extensionStats[ext].size += file.size;
    });

    content += `## 文件统计\n\n`;
    content += `- 总文件数: ${files.length}\n`;
    content += `- 总大小: ${this.formatFileSize(totalSize)}\n\n`;

    // 文件类型分布
    if (Object.keys(extensionStats).length > 0) {
      content += `### 文件类型分布\n\n`;
      content += `| 扩展名 | 文件数 | 总大小 |\n`;
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

    // 文件内容
    content += `## 文件内容\n\n`;

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
