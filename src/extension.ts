// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  activateTemplatesAutocompletion,
  updateTemplatesCompletions,
} from "./providers/templates";
import {
  activateUrlNamesAutocompletion,
  updateUrlsConfigsCache,
} from "./providers/urls";
import { isDjangoProject } from "./utils";
import {
  activateStaticFilesAutocompletion,
  updateCachedStaticFiles,
} from "./providers/staticfiles";
import { DjhtmlFormatter } from "./providers/djhtml_formatter";

export async function activate(context: vscode.ExtensionContext) {
  const isDjango = await isDjangoProject();

  if (!isDjango) {
    return;
  }
  let activate = vscode.commands.registerCommand("wellDjango.activate", () => {
    vscode.window.showInformationMessage("Well Django: activated.");
    activateTemplatesAutocompletion(context);
    activateUrlNamesAutocompletion(context);
    activateStaticFilesAutocompletion(context);
  });

  let update = vscode.commands.registerCommand("wellDjango.updateCache", () => {
    vscode.window.showInformationMessage(
      "Well Django: cache update incomming."
    );
    updateTemplatesCompletions();
    updateUrlsConfigsCache();
    updateCachedStaticFiles();
  });
  vscode.commands.executeCommand("wellDjango.activate");

  const outputChannel = vscode.window.createOutputChannel("wellDjango", {
    log: true,
  });
  context.subscriptions.push(outputChannel);
  new DjhtmlFormatter(context, outputChannel).activate();
  context.subscriptions.push(activate);
  context.subscriptions.push(update);
}

export function deactivate() {}
