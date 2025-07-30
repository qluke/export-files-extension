import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export interface FileInfo {
  path: string;
  relativePath: string;
  content: string;
  size: number;
  extension: string;
}

export class FileExporter {
  private basePath: string;
  private config = {
    ignore: [
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build",
      "coverage",
      ".env",
      ".DS_Store",
      "Thumbs.db",
      ".vercel",
    ],
    ignoreExtensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".svg",
      ".ico",
      ".webp",
      ".pdf",
      ".zip",
      ".rar",
      ".7z",
      ".ttf",
      ".woff",
      ".woff2",
    ],
    maxFileSize: 1024 * 1024, // 1MB
  };

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async getAllFiles(): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    await this.scanDirectory(this.basePath, files);
    return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private async scanDirectory(dir: string, files: FileInfo[]): Promise<void> {
    try {
      const items = await readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);

        if (this.shouldIgnore(fullPath)) {
          continue;
        }

        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await this.scanDirectory(fullPath, files);
        } else if (stats.isFile()) {
          if (stats.size > this.config.maxFileSize) {
            continue;
          }

          try {
            const content = await readFile(fullPath, "utf8");
            const relativePath = path.relative(this.basePath, fullPath);

            files.push({
              path: fullPath,
              relativePath,
              content,
              size: stats.size,
              extension: path.extname(fullPath).toLowerCase(),
            });
          } catch (error) {
            // 跳过无法读取的文件
            console.log(`跳过文件: ${fullPath}`);
          }
        }
      }
    } catch (error) {
      console.error(`无法读取目录: ${dir}`, error);
    }
  }

  private shouldIgnore(filePath: string): boolean {
    const basename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return (
      this.config.ignore.includes(basename) ||
      this.config.ignoreExtensions.includes(ext) ||
      filePath.includes("node_modules") ||
      filePath.includes(".git")
    );
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, "utf8");
  }
}
