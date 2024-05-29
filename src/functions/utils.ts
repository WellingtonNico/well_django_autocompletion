import * as vscode from "vscode";

export function createDocumentFiltersForExtensions(extensions: string[]) {
  return extensions.map((languageCode) => ({
    scheme: "file",
    pattern: `**/*.${languageCode}`,
  }));
}

export function createEndsWithRegex(strings: string[]) {
  const escapedStrings = strings.map((str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = escapedStrings.join("|") + "$";
  return new RegExp(pattern);
}

export function getCleanedLine(
  document: vscode.TextDocument,
  currentPosition: vscode.Position,
  linesToCheck: number
) {
  let lineIndex = (currentPosition as any).c - linesToCheck;
  if (lineIndex < 0) {
    lineIndex = 0;
  }
  const initialPosition = new vscode.Position(lineIndex, 0);
  const line = document
    .getText(new vscode.Range(initialPosition, currentPosition))
    .replace(/[\'\"|\t|\n\s]/g, "");
  return line;
}

export async function isDjangoProject() {
  let manage = await vscode.workspace.findFiles("**/manage.py");
  let settings = await vscode.workspace.findFiles("**/settings.py");
  if (manage.length && settings.length) {
    return true;
  } else {
    return false;
  }
}