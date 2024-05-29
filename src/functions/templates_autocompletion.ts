import * as vscode from "vscode";

const extensionsForTemplates = ["html", "py"];
const knownTriggersPrefixes = [
  "{% include '",
  "{% extends '",
  '{% include "',
  '{% extends "',
  "template_name='",
  'template_name="',
  "template_name = '",
  'template_name = "',
  "render(",
];

type TemplatesGroups = {
  [key: string]: string[];
};

async function getTemplatesFilesUris() {
  return await vscode.workspace.findFiles("**/templates/**/*.html");
}

function cleanTemplatesUris(uris: vscode.Uri[]) {
  const result: TemplatesGroups = {};
  uris.forEach((uri) => {
    const dir = uri.fsPath;
    const cleanedFileDir = dir.split("templates/")[1];
    const startName = cleanedFileDir.split("/")[0];
    if (!result[startName]) {
      result[startName] = [];
    }
    result[startName].push(cleanedFileDir);
  });
  return result;
}

function createTriggersForGroupKey(key: string) {
  return knownTriggersPrefixes.map((trigger) => `${trigger}${key}`);
}

function createTemplatesProvider(
  languageCodes: vscode.DocumentFilter[],
  items: vscode.CompletionItem[],
  triggers: string[]
) {
  return vscode.languages.registerCompletionItemProvider(
    languageCodes,
    {
      provideCompletionItems() {
        console.log("retornando itens");
        return items;
      },
    },
    ...triggers
  );
}

function convertPathsToCompletionItems(paths: string[]) {
  return paths
    .map((path) => ({
      label: path,
      kind: vscode.CompletionItemKind.File,
      insertText: path,
    }))
    .sort();
}

function createDocumentFiltersForExtensions(extensions: string[]) {
  return extensions.map((languageCode) => ({
    scheme: "file",
    pattern: `**/*.${languageCode}`,
  }));
}

export async function activateTemplatesAutocompletion(
  context: vscode.ExtensionContext
) {
  const templatesFilesUris = await getTemplatesFilesUris();
  const templatesGroups = cleanTemplatesUris(templatesFilesUris);

  Object.entries(templatesGroups).forEach(([groupKey, cleanedTamplates]) => {
    const triggers = createTriggersForGroupKey(groupKey);
    const completionItems = convertPathsToCompletionItems(cleanedTamplates);
    const languageFilters = createDocumentFiltersForExtensions(
      extensionsForTemplates
    );
    context.subscriptions.push(
      createTemplatesProvider(languageFilters, completionItems, triggers)
    );
  });
}
