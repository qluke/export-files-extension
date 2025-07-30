import * as vscode from "vscode";
import * as path from "path";
import { FileExporter } from "./utils/fileUtils";
import { MarkdownGenerator } from "./utils/markdownGen";

export async function exportFilesToMarkdown(folderPath: string) {
  try {
    // 显示输入框让用户选择输出文件名
    const outputFileName = await vscode.window.showInputBox({
      prompt: "请输入输出文件名",
      value: "project-files.md",
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return "文件名不能为空";
        }
        if (!value.endsWith(".md")) {
          return "文件名必须以.md结尾";
        }
        return null;
      },
    });

    if (!outputFileName) {
      return;
    }

    // 显示进度条
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "正在导出文件...",
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });

        const fileExporter = new FileExporter(folderPath);
        const markdownGen = new MarkdownGenerator();

        progress.report({ increment: 30, message: "扫描文件..." });
        const files = await fileExporter.getAllFiles();

        progress.report({ increment: 60, message: "生成Markdown..." });
        const markdownContent = await markdownGen.generateMarkdown(
          folderPath,
          files,
          outputFileName
        );

        progress.report({ increment: 90, message: "保存文件..." });
        const outputPath = path.join(folderPath, outputFileName);
        await fileExporter.writeFile(outputPath, markdownContent);

        progress.report({ increment: 100 });
      }
    );

    vscode.window
      .showInformationMessage(
        `文件导出成功！保存至: ${outputFileName}`,
        "打开文件"
      )
      .then((selection) => {
        if (selection === "打开文件") {
          vscode.workspace
            .openTextDocument(path.join(folderPath, outputFileName))
            .then((doc) => {
              vscode.window.showTextDocument(doc);
            });
        }
      });
  } catch (error) {
    vscode.window.showErrorMessage(`导出失败: ${error}`);
  }
}
