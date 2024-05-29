// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { activateTemplatesAutocompletion } from "./functions/templates_autocompletion";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "well_autocomplete.ativar",
    () => {
      vscode.window.showInformationMessage("Well autocomplete ativada.");
      activateTemplatesAutocompletion(context);
    }
  );
  vscode.commands.executeCommand("well_autocomplete.ativar");
  context.subscriptions.push(disposable);
}

export function deactivate() {}