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
import { isDjangoProject } from "./functions/utils";

export async function activate(context: vscode.ExtensionContext) {
  const isDjango = await isDjangoProject();

  if (!isDjango) {
    return;
  }
  let activate = vscode.commands.registerCommand(
    "well_django_autocompletion.activate",
    () => {
      vscode.window.showInformationMessage(
        "Well Django Autocomplete activated."
      );
      activateTemplatesAutocompletion(context);
      activateUrlNamesAutocompletion(context);
    }
  );
  let update = vscode.commands.registerCommand(
    "well_django_autocompletion.update_cache",
    () => {
      vscode.window.showInformationMessage(
        "Well Django Autocomplete cache update incomming."
      );
      updateTemplatesCompletions();
      updateUrlsConfigsCache();
    }
  );
  vscode.commands.executeCommand("well_django_autocompletion.activate");
  context.subscriptions.push(activate);
  context.subscriptions.push(update);
}

export function deactivate() {}
