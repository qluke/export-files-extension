import * as vscode from "vscode";
import * as path from "path";
import { FileExporter, ExportConfig } from "./utils/fileUtils";
import { MarkdownGenerator } from "./utils/markdownGen";

function getExportConfig(): ExportConfig {
  const config = vscode.workspace.getConfiguration("exportFiles");

  return {
    ignore: config.get<string[]>("ignore", []),
    ignoreExtensions: config.get<string[]>("ignoreExtensions", []),
    outputFile: config.get<string>("outputFile", "project-files.md"),
    recursive: config.get<boolean>("recursive", true),
    includeStructure: config.get<boolean>("includeStructure", true),
    includeStats: config.get<boolean>("includeStats", true),
    maxFileSize: config.get<number>("maxFileSize", 1048576),
  };
}

export async function exportFilesToMarkdown(folderPath: string) {
  try {
    // Get configuration
    const config = getExportConfig();

    // Show input box for user to choose output filename
    const outputFileName = await vscode.window.showInputBox({
      prompt: "Enter output filename",
      value: config.outputFile,
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return "Filename cannot be empty";
        }
        if (!value.endsWith(".md")) {
          return "Filename must end with .md";
        }
        return null;
      },
    });

    if (!outputFileName) {
      return;
    }

    // Show progress bar
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Exporting files...",
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });

        const fileExporter = new FileExporter(folderPath, config);
        const markdownGen = new MarkdownGenerator();

        progress.report({ increment: 20, message: "Scanning files..." });
        const files = await fileExporter.getAllFiles();

        progress.report({
          increment: 40,
          message: "Generating directory structure...",
        });
        const directoryStructure = await fileExporter.getDirectoryStructure();

        progress.report({ increment: 70, message: "Generating Markdown..." });
        const markdownContent = await markdownGen.generateMarkdown(
          folderPath,
          files,
          outputFileName,
          config,
          directoryStructure
        );

        progress.report({ increment: 90, message: "Saving file..." });
        const outputPath = path.join(folderPath, outputFileName);
        await fileExporter.writeFile(outputPath, markdownContent);

        progress.report({ increment: 100 });
      }
    );

    vscode.window
      .showInformationMessage(
        `Files exported successfully! Saved to: ${outputFileName}`,
        "Open File"
      )
      .then((selection) => {
        if (selection === "Open File") {
          vscode.workspace
            .openTextDocument(path.join(folderPath, outputFileName))
            .then((doc) => {
              vscode.window.showTextDocument(doc);
            });
        }
      });
  } catch (error) {
    vscode.window.showErrorMessage(`Export failed: ${error}`);
  }
}
