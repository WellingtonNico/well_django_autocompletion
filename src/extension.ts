// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  activateTemplatesAutocompletion,
  updateTemplatesCompletions,
} from "./functions/templates_autocompletion";
import {
  activateUrlNamesAutocompletion,
  updateUrlsConfigsCache,
} from "./functions/urls_autocompletion";

export function activate(context: vscode.ExtensionContext) {
  let activate = vscode.commands.registerCommand(
    "well_autocomplete.activate",
    () => {
      vscode.window.showInformationMessage("Well autocomplete activated.");
      activateTemplatesAutocompletion(context);
      activateUrlNamesAutocompletion(context);
    }
  );
  let update = vscode.commands.registerCommand(
    "well_autocomplete.update_cache",
    () => {
      vscode.window.showInformationMessage(
        "Well autocomplete update incomming."
      );
      updateTemplatesCompletions();
      updateUrlsConfigsCache();
    }
  );
  vscode.commands.executeCommand("well_autocomplete.activate");
  context.subscriptions.push(activate);
  context.subscriptions.push(update);
}

export function deactivate() {}
