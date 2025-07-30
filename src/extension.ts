import * as vscode from "vscode";
import { exportFilesToMarkdown } from "./exportFiles";

export function activate(context: vscode.ExtensionContext) {
  console.log("Export Files Extension activated");

  const disposable = vscode.commands.registerCommand(
    "exportFiles.exportToMarkdown",
    async (uri: vscode.Uri) => {
      if (uri && uri.fsPath) {
        await exportFilesToMarkdown(uri.fsPath);
      } else {
        vscode.window.showErrorMessage("Please select a folder");
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
