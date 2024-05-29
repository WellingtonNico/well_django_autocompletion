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

async function getTemplatesFilesUris() {
  return await vscode.workspace.findFiles("**/templates/**/*.html");
}

function cleanTemplatesUris(uris: vscode.Uri[]) {
  return uris.map((url) => {
    const dir = url.fsPath;
    return dir.split("templates/")[1];
  });
}

function createTriggersForGroupKey(key: string) {
  return knownTriggersPrefixes.map((trigger) => `${trigger}${key}`);
}

async function provideCompletionItems() {
  const templatesFilesUris = await getTemplatesFilesUris();
  const cleanedTamplates = cleanTemplatesUris(templatesFilesUris);
  return convertPathsToCompletionItems(cleanedTamplates);
}

function convertPathsToCompletionItems(cleanedTemplates: string[]) {
  return cleanedTemplates
    .map((cleanedTemplate) => ({
      label: cleanedTemplate,
      kind: vscode.CompletionItemKind.File,
      insertText: cleanedTemplate,
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
  const triggers = createTriggersForGroupKey("");
  const languageFilters = createDocumentFiltersForExtensions(
    extensionsForTemplates
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      languageFilters,
      {
        provideCompletionItems,
      },
      ...triggers
    )
  );
}
