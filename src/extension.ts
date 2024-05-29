// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { activateTemplatesAutocompletion } from "./functions/templates_autocompletion";

export function activate(context: vscode.ExtensionContext) {
  console.log("Extensão ativada!");

  let disposable = vscode.commands.registerCommand("teste1.ativar", () => {
    vscode.window.showInformationMessage("Extensão ativada.");
    activateTemplatesAutocompletion(context);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
