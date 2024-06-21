import { PythonExtension } from "@vscode/python-extension";
import * as vscode from "vscode";

export const configSection = "wellDjango";

export function getConfig(
  scope?: vscode.ConfigurationScope
): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(configSection, scope);
}

export function noop(): undefined {}

export const fileBeginningRange = new vscode.Range(
  new vscode.Position(0, 0),
  new vscode.Position(0, 0)
);

export function getCompleteWordFromLine(
  document: vscode.TextDocument,
  lineNumber: number,
  partialWord: string
) {
  const regex = new RegExp(
    String.raw`['"]([^'\s"]*${partialWord}[^'\s"]*)['"]`,
    "gi"
  );

  const line = document.lineAt(lineNumber).text;

  const matches = regex.exec(line);

  if (matches && matches[1]) {
    return matches[1];
  }
  return null;
}

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

export function getCleanedLineUntilPosition(
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
  let manage = await vscode.workspace.findFiles("**/**/manage.py");
  let settings = await vscode.workspace.findFiles("**/**/settings.py");
  if (manage.length && settings.length) {
    return true;
  } else {
    return false;
  }
}

async function getPythonPath(document: vscode.TextDocument): Promise<string> {
  const config = getConfig(document);
  if (config.get<boolean>("useVenv")) {
    const api = await PythonExtension.api().catch(noop);
    if (api) {
      const environment = await api.environments.resolveEnvironment(
        api.environments.getActiveEnvironmentPath(document.uri)
      );
      const pythonExecUri = environment?.executable.uri;
      if (pythonExecUri) {
        return pythonExecUri.fsPath;
      }
      const msg = "Well Django: failed to get python path.";
      throw new Error(msg);
    }
  }
  const pythonPath = config.get<string>("pythonPath");
  if (pythonPath) {
    return pythonPath;
  }

  const msg = `Invalid ${configSection}.pythonPath setting.`;
  throw new Error(msg);
}

type ArgType = string | number;

export async function runPythonCommand(
  document: vscode.TextDocument,
  ...args: ArgType[]
) {
  const pythonPath = await getPythonPath(document).catch((e: Error) => {
    void vscode.window.showErrorMessage(e.message);
    throw e;
  });

  return execCommand(pythonPath, ...args)
    .catch((e: any) => {
      void vscode.window.showErrorMessage(
        `Well Django: an error occurred when tried to run python command: ${e.message}`
      );
    })
    .then((result: any) => result);

  // const execa = require("execa");
  // return execa(pythonPath, ["-m", ...args.map((arg) => String(arg))])
  //   .catch((e: any) => {
  //     void vscode.window.showErrorMessage(
  //       `Well Django: an error ocurred when tried to run python command: ${e.message}`
  //     );
  //   })
  //   .then((result: any) => result.stdout);
}
async function execCommand(
  command: string,
  ...args: ArgType[]
): Promise<string> {
  const childProcess = require("child_process");
  return new Promise((resolve, reject) => {
    childProcess.execFile(
      command,
      [...args.map((arg) => String(arg))],
      (error: any, stdout: any, stderr: any) => {
        if (error) {
          void vscode.window.showErrorMessage(
            `Well Django: an error occurred when tried to run python command: ${error.message}`
          );
          reject(error);
        } else {
          resolve(stdout.toString());
        }
      }
    );
  });
}

// export async function runPythonCommand(
//   document: vscode.TextDocument,
//   args: ArgType[]
// ) {
//   const pythonPath = await getPythonPath(document).catch((e: Error) => {
//     void vscode.window.showErrorMessage(e.message);
//     throw e;
//   });

//   return execCommand(pythonPath, args)
//      .catch((e: any) => {
//       void vscode.window.showErrorMessage(
//         `Well Django: an error occurred when tried to run python command: ${e.message}`
//       );
//     })
//      .then((result: any) => result);
// }
