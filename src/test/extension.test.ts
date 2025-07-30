import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";

// Import modules to test
import * as myExtension from "../extension";
import { FileExporter, ExportConfig } from "../utils/fileUtils";
import { MarkdownGenerator } from "../utils/markdownGen";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);

suite("Export Files Extension Test Suite", () => {
  let testWorkspace: string;

  suiteSetup(async () => {
    // Create test workspace
    testWorkspace = path.join(__dirname, "test-workspace");
    await mkdir(testWorkspace, { recursive: true });

    // Create test files
    await writeFile(
      path.join(testWorkspace, "test.js"),
      'console.log("test");'
    );
    await writeFile(
      path.join(testWorkspace, "test.ts"),
      'const test: string = "hello";'
    );
    await writeFile(path.join(testWorkspace, "README.md"), "# Test Project");

    // Create subdirectory
    await mkdir(path.join(testWorkspace, "src"), { recursive: true });
    await writeFile(
      path.join(testWorkspace, "src", "index.ts"),
      "export default {};"
    );

    // Create files to ignore
    await mkdir(path.join(testWorkspace, "node_modules"), { recursive: true });
    await writeFile(
      path.join(testWorkspace, "node_modules", "ignored.js"),
      "ignored"
    );
    await writeFile(path.join(testWorkspace, "test.jpg"), "fake image");
  });

  suiteTeardown(async () => {
    // Clean up test workspace
    try {
      await rmdir(testWorkspace, { recursive: true });
    } catch (error) {
      console.log("Cleanup warning:", error);
    }
  });

  suite("Extension Activation", () => {
    test("should activate without errors", () => {
      const context = {
        subscriptions: [],
      } as unknown as vscode.ExtensionContext;

      assert.doesNotThrow(() => {
        myExtension.activate(context);
      });

      assert.strictEqual(context.subscriptions.length, 1);
    });

    test("should register exportToMarkdown command", async () => {
      const commands = await vscode.commands.getCommands();
      assert.ok(commands.includes("exportFiles.exportToMarkdown"));
    });
  });

  suite("FileExporter", () => {
    const defaultConfig: ExportConfig = {
      ignore: ["node_modules", ".git"],
      ignoreExtensions: [".jpg", ".png"],
      outputFile: "test-output.md",
      recursive: true,
      includeStructure: true,
      includeStats: true,
      maxFileSize: 1024 * 1024,
    };

    test("should create FileExporter instance", () => {
      const exporter = new FileExporter(testWorkspace, defaultConfig);
      assert.ok(exporter);
    });

    test("should get all files excluding ignored ones", async () => {
      const exporter = new FileExporter(testWorkspace, defaultConfig);
      const files = await exporter.getAllFiles();

      const filePaths = files.map((f) => f.relativePath);

      // Should include text files
      assert.ok(filePaths.some((p) => p.includes("test.js")));
      assert.ok(filePaths.some((p) => p.includes("test.ts")));
      assert.ok(filePaths.some((p) => p.includes("README.md")));

      // Should not include ignored files
      assert.ok(!filePaths.some((p) => p.includes("test.jpg")));
      assert.ok(!filePaths.some((p) => p.includes("node_modules")));
    });

    test("should respect recursive setting", async () => {
      const nonRecursiveConfig = { ...defaultConfig, recursive: false };
      const exporter = new FileExporter(testWorkspace, nonRecursiveConfig);
      const files = await exporter.getAllFiles();

      const filePaths = files.map((f) => f.relativePath);

      // Should not include files from subdirectories
      assert.ok(!filePaths.some((p) => p.includes("src/index.ts")));
      assert.ok(filePaths.some((p) => p.includes("test.js")));
    });

    test("should generate directory structure", async () => {
      const exporter = new FileExporter(testWorkspace, defaultConfig);
      const structure = await exporter.getDirectoryStructure();

      assert.ok(structure.length > 0);
      assert.ok(structure.includes("src"));
      assert.ok(!structure.includes("node_modules"));
    });
  });

  suite("MarkdownGenerator", () => {
    const generator = new MarkdownGenerator();
    const mockConfig: ExportConfig = {
      ignore: [],
      ignoreExtensions: [],
      outputFile: "test.md",
      recursive: true,
      includeStructure: true,
      includeStats: true,
      maxFileSize: 0,
    };

    test("should generate markdown with all sections", async () => {
      const files = [
        {
          path: "/test/file.js",
          relativePath: "file.js",
          content: 'console.log("test");',
          size: 20,
          extension: ".js",
        },
      ];

      const markdown = await generator.generateMarkdown(
        testWorkspace,
        files,
        "output.md",
        mockConfig,
        "test-structure"
      );

      assert.ok(markdown.includes("# Project Files Export"));
      assert.ok(markdown.includes("## Directory Structure"));
      assert.ok(markdown.includes("## File Statistics"));
      assert.ok(markdown.includes("## File Contents"));
      assert.ok(markdown.includes("Total files: 1"));
    });

    test("should exclude sections based on config", async () => {
      const configNoStats = { ...mockConfig, includeStats: false };

      const files = [
        {
          path: "/test/file.js",
          relativePath: "file.js",
          content: "test",
          size: 4,
          extension: ".js",
        },
      ];

      const markdown = await generator.generateMarkdown(
        testWorkspace,
        files,
        "output.md",
        configNoStats
      );

      assert.ok(!markdown.includes("## File Statistics"));
      assert.ok(markdown.includes("## File Contents"));
    });
  });

  suite("Error Handling", () => {
    test("should handle invalid paths gracefully", async () => {
      const invalidPath = "/invalid/path";
      const exporter = new FileExporter(invalidPath, {
        ignore: [],
        ignoreExtensions: [],
        outputFile: "test.md",
        recursive: true,
        includeStructure: true,
        includeStats: true,
        maxFileSize: 0,
      });

      const files = await exporter.getAllFiles();
      assert.strictEqual(files.length, 0);
    });
  });

  suite("Input Validation", () => {
    test("should validate filename input", () => {
      const validateInput = (value: string) => {
        if (!value || !value.trim()) {
          return "Filename cannot be empty";
        }
        if (!value.endsWith(".md")) {
          return "Filename must end with .md";
        }
        return null;
      };

      assert.strictEqual(validateInput(""), "Filename cannot be empty");
      assert.strictEqual(validateInput("  "), "Filename cannot be empty");
      assert.strictEqual(
        validateInput("test.txt"),
        "Filename must end with .md"
      );
      assert.strictEqual(validateInput("test.md"), null);
    });
  });

  suite("File Size Handling", () => {
    test("should respect maxFileSize configuration", async () => {
      const smallSizeConfig: ExportConfig = {
        ignore: ["node_modules"],
        ignoreExtensions: [".jpg"],
        outputFile: "test.md",
        recursive: true,
        includeStructure: true,
        includeStats: true,
        maxFileSize: 5, // Very small size
      };

      const exporter = new FileExporter(testWorkspace, smallSizeConfig);
      const files = await exporter.getAllFiles();

      // Should exclude larger files
      assert.ok(files.length < 3);
    });

    test("should not limit file size when maxFileSize is 0", async () => {
      const noLimitConfig: ExportConfig = {
        ignore: ["node_modules"],
        ignoreExtensions: [".jpg"],
        outputFile: "test.md",
        recursive: true,
        includeStructure: true,
        includeStats: true,
        maxFileSize: 0, // No limit
      };

      const exporter = new FileExporter(testWorkspace, noLimitConfig);
      const files = await exporter.getAllFiles();

      // Should include all valid files regardless of size
      assert.ok(files.length >= 3);
    });
  });

  suite("Pattern Matching", () => {
    test("should handle wildcard patterns", async () => {
      const wildcardConfig: ExportConfig = {
        ignore: ["*.js", "test.*"],
        ignoreExtensions: [],
        outputFile: "test.md",
        recursive: true,
        includeStructure: true,
        includeStats: true,
        maxFileSize: 0,
      };

      const exporter = new FileExporter(testWorkspace, wildcardConfig);
      const files = await exporter.getAllFiles();
      const filePaths = files.map((f) => f.relativePath);

      // Should exclude files matching patterns
      assert.ok(!filePaths.some((p) => p.includes("test.js")));
      assert.ok(!filePaths.some((p) => p.includes("test.ts")));
    });
  });

  suite("Markdown Content Generation", () => {
    test("should include proper language highlighting", async () => {
      const generator = new MarkdownGenerator();
      const files = [
        {
          path: "/test/script.js",
          relativePath: "script.js",
          content: 'console.log("hello");',
          size: 20,
          extension: ".js",
        },
        {
          path: "/test/styles.css",
          relativePath: "styles.css",
          content: "body { margin: 0; }",
          size: 18,
          extension: ".css",
        },
        {
          path: "/test/data.json",
          relativePath: "data.json",
          content: '{"key": "value"}',
          size: 16,
          extension: ".json",
        },
      ];

      const config: ExportConfig = {
        ignore: [],
        ignoreExtensions: [],
        outputFile: "test.md",
        recursive: true,
        includeStructure: false,
        includeStats: false,
        maxFileSize: 0,
      };

      const markdown = await generator.generateMarkdown(
        testWorkspace,
        files,
        "output.md",
        config
      );

      // Should use correct language identifiers
      assert.ok(markdown.includes("```javascript"));
      assert.ok(markdown.includes("```css"));
      assert.ok(markdown.includes("```json"));
    });

    test("should handle files without extensions", async () => {
      const generator = new MarkdownGenerator();
      const files = [
        {
          path: "/test/Dockerfile",
          relativePath: "Dockerfile",
          content: "FROM node:14",
          size: 12,
          extension: "",
        },
      ];

      const config: ExportConfig = {
        ignore: [],
        ignoreExtensions: [],
        outputFile: "test.md",
        recursive: true,
        includeStructure: false,
        includeStats: true,
        maxFileSize: 0,
      };

      const markdown = await generator.generateMarkdown(
        testWorkspace,
        files,
        "output.md",
        config
      );

      // Should handle files without extensions
      assert.ok(markdown.includes("(no extension)"));
      assert.ok(markdown.includes("```plaintext"));
    });
  });

  suite("Directory Structure Generation", () => {
    test("should generate proper tree structure", async () => {
      const config: ExportConfig = {
        ignore: ["node_modules"],
        ignoreExtensions: [".jpg"],
        outputFile: "test.md",
        recursive: true,
        includeStructure: true,
        includeStats: false,
        maxFileSize: 0,
      };

      const exporter = new FileExporter(testWorkspace, config);
      const structure = await exporter.getDirectoryStructure();

      // Should contain tree-like structure
      assert.ok(structure.includes("├──") || structure.includes("└──"));
      assert.ok(structure.includes("src"));
    });

    test("should not generate structure when disabled", async () => {
      const config: ExportConfig = {
        ignore: [],
        ignoreExtensions: [],
        outputFile: "test.md",
        recursive: true,
        includeStructure: false,
        includeStats: false,
        maxFileSize: 0,
      };

      const exporter = new FileExporter(testWorkspace, config);
      const structure = await exporter.getDirectoryStructure();

      // Should return empty string when disabled
      assert.strictEqual(structure, "");
    });
  });
});
