import * as vscode from "vscode";

const cacheSeconds = 30;

const triggers = ['"', "'"];

const configs = [
  { extensions: ["py"], checks: ["render(", "template_name="] },
  { extensions: ["html"], checks: ["{%include", "{%extends"] },
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

function getCleanedLine(
  document: vscode.TextDocument,
  currentPosition: vscode.Position
) {
  let lineIndex = (currentPosition as any).c;
  if (lineIndex > 0) {
    lineIndex--;
  }
  const initialPosition = new vscode.Position(lineIndex, 0);
  const line = document
    .getText(new vscode.Range(initialPosition, currentPosition))
    .replace(/[\'\"|\t|\n\s]/g, "");
  return line;
}

function createEndsWithRegex(strings: string[]) {
  // Escape special characters in the strings and join them with the '|' (OR) operator
  const escapedStrings = strings.map((str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = escapedStrings.join("|") + "$";
  return new RegExp(pattern);
}

export async function activateTemplatesAutocompletion(
  context: vscode.ExtensionContext
) {
  for (const config of configs) {
    const languageFilters = createDocumentFiltersForExtensions(
      config.extensions
    );
    const regexPattern = createEndsWithRegex(config.checks);
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        languageFilters,
        {
          async provideCompletionItems(document, position, _, context) {
            const line = getCleanedLine(document, position);
            if (regexPattern.test(line)) {
              return await getOrUpdateCompletionItems();
            }
            return await Promise.resolve([]);
          },
        },
        ...triggers
      )
    );
  }
}
