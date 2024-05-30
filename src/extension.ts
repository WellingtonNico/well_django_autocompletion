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
import {
  activateStaticFilesAutocompletion,
  updateCachedStaticFiles,
} from "./functions/staticfiles_autocompletion";

export async function activate(context: vscode.ExtensionContext) {
  const isDjango = await isDjangoProject();

  if (!isDjango) {
    return;
  }
  let activate = vscode.commands.registerCommand(
    "welldjangoautocompletion.activate",
    () => {
      vscode.window.showInformationMessage(
        "Well Django Autocomplete activated."
      );
      activateTemplatesAutocompletion(context);
      activateUrlNamesAutocompletion(context);
      activateStaticFilesAutocompletion(context);
    }
  );
  let update = vscode.commands.registerCommand(
    "welldjangoautocompletion.update_cache",
    () => {
      vscode.window.showInformationMessage(
        "Well Django Autocomplete cache update incomming."
      );
      updateTemplatesCompletions();
      updateUrlsConfigsCache();
      updateCachedStaticFiles();
    }
  );
  vscode.commands.executeCommand("welldjangoautocompletion.activate");
  context.subscriptions.push(activate);
  context.subscriptions.push(update);
}

export function deactivate() {}
