import * as vscode from "vscode";
import { exportFilesToMarkdown } from "./exportFiles";

export function activate(context: vscode.ExtensionContext) {
  console.log("文件导出插件已激活");

  const disposable = vscode.commands.registerCommand(
    "exportFiles.exportToMarkdown",
    async (uri: vscode.Uri) => {
      if (uri && uri.fsPath) {
        await exportFilesToMarkdown(uri.fsPath);
      } else {
        vscode.window.showErrorMessage("请选择一个文件夹");
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
