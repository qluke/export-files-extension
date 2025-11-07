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

export interface ExportConfig {
  ignore: string[];
  ignoreExtensions: string[];
  outputFile: string;
  recursive: boolean;
  includeStructure: boolean;
  includeStats: boolean;
  maxFileSize: number;
}

export class FileExporter {
  private basePath: string;
  private config: ExportConfig;

  constructor(basePath: string, config: ExportConfig) {
    this.basePath = basePath;
    this.config = config;
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
          // Only scan subdirectories when recursion is enabled
          if (this.config.recursive) {
            await this.scanDirectory(fullPath, files);
          }
        } else if (stats.isFile()) {
          // Check file size limit, 0 means no limit
          if (
            this.config.maxFileSize > 0 &&
            stats.size > this.config.maxFileSize
          ) {
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
            // Skip files that cannot be read
            console.log(`Skipping file: ${fullPath}`);
          }
        }
      }
    } catch (error) {
      console.error(`Unable to read directory: ${dir}`, error);
    }
  }

  private shouldIgnore(filePath: string): boolean {
    const basename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const relativePath = path.relative(this.basePath, filePath);

    // Check extensions
    if (this.config.ignoreExtensions.includes(ext)) {
      return true;
    }

    // Check ignore list, support wildcard matching
    for (const pattern of this.config.ignore) {
      // Check if basename matches the pattern
      if (this.matchPattern(basename, pattern)) {
        return true;
      }

      // Check if any part of the relative path matches the pattern
      // This ensures "out" matches "out" directory but not "layout.tsx"
      const pathParts = relativePath.split(path.sep);
      for (const part of pathParts) {
        if (this.matchPattern(part, pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  private matchPattern(str: string, pattern: string): boolean {
    // Simple wildcard matching, supports * and ?
    if (!pattern.includes("*") && !pattern.includes("?")) {
      return str === pattern;
    }

    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, "utf8");
  }

  async getDirectoryStructure(): Promise<string> {
    if (!this.config.includeStructure) {
      return "";
    }

    const structure: string[] = [];
    await this.buildDirectoryTree(this.basePath, structure, "");
    return structure.join("\n");
  }

  private async buildDirectoryTree(
    dir: string,
    structure: string[],
    prefix: string
  ): Promise<void> {
    try {
      const items = await readdir(dir);
      const validItems: { name: string; isDirectory: boolean }[] = [];

      for (const item of items) {
        const fullPath = path.join(dir, item);

        if (this.shouldIgnore(fullPath)) {
          continue;
        }

        const stats = await stat(fullPath);
        validItems.push({ name: item, isDirectory: stats.isDirectory() });
      }

      // Sort items: directories first, then alphabetical
      validItems.sort((a, b) => {
        // Directories come first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      // Process items sequentially with await for directories
      for (let index = 0; index < validItems.length; index++) {
        const item = validItems[index];
        const isLast = index === validItems.length - 1;
        const connector = isLast ? "└── " : "├── ";
        structure.push(`${prefix}${connector}${item.name}`);

        if (item.isDirectory && this.config.recursive) {
          const newPrefix = prefix + (isLast ? "    " : "│   ");
          const fullPath = path.join(dir, item.name);
          await this.buildDirectoryTree(fullPath, structure, newPrefix);
        }
      }
    } catch (error) {
      console.error(`Unable to read directory structure: ${dir}`, error);
    }
  }
}
