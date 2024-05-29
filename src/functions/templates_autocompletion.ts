import * as vscode from "vscode";

const extensionsForTemplates = ["html", "py"];
const cacheSeconds = 30;
const knownTriggersPrefixes = [
  "{%include",
  "{%extends",
  'render(',
  "render(",
  "template_name=",
 
];

let cachedTemplates: vscode.CompletionItem[] = [];
let cachedLastUpdatedTime = new Date().getTime();

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

async function getOrUpdateCompletionItems() {
  const now = new Date().getTime();
  if (
    now - cachedLastUpdatedTime < cacheSeconds * 1000 &&
    cachedTemplates.length > 0
  ) {
    return cachedTemplates;
  }
  try {
    const templatesFilesUris = await getTemplatesFilesUris();
    const cleanedTemplates = cleanTemplatesUris(templatesFilesUris);
    const completionItems = convertPathsToCompletionItems(cleanedTemplates);
    cachedTemplates = completionItems;
    cachedLastUpdatedTime = now;
    return completionItems;
  } catch (error) {
    console.error(error);
    return [];
  }
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
        async provideCompletionItems(document, position, _, context) {          
          const initialPosition = new vscode.Position((position as any).c, 0);
          const line = document.getText(
            new vscode.Range(initialPosition, position)
          ).replace(/['"]| /g, '');
          for (const trigger of knownTriggersPrefixes) {
            if (line.endsWith(trigger)) {
              return await getOrUpdateCompletionItems();             
            }
          }
          return await Promise.resolve([]);
        },
      },
      '"',
      "'"
    )
  );
}
