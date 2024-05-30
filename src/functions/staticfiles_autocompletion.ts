import * as vscode from "vscode";
import * as types from "../types/main";
import {
  createDocumentFiltersForExtensions,
  createEndsWithRegex,
  fileBeginningRange,
  getCleanedLine,
  getCompleteWordFromLine,
} from "./utils";

const cacheSeconds = 240;

const triggers = ['"', "'"];

const linesToCheck = 1;

const configs: types.ProviderConfig[] = [
  { extensions: ["html", "py"], checks: ["{%static", "{%extends", "src="] },
  { extensions: ["js"], checks: ["src=", "url(", "@import"] },
  { extensions: ["css"], checks: ["url(", "@import"] },
];

type CleanedFiles = {
  [key: string]: vscode.Uri[];
};

let cachedStaticFilesCompletionItems: vscode.CompletionItem[] = [];
let cachedStaticFilesDefinitions: CleanedFiles = {};
let cachedLastUpdatedTime = new Date().getTime();

async function getStaticFilesUris() {
  return [
    ...(await vscode.workspace.findFiles("**/static/**/*")),
    ...(await vscode.workspace.findFiles("**/staticfiles/**/*")),
  ];
}

export async function updateCachedStaticFiles() {
  const uris = await getStaticFilesUris();
  cachedStaticFilesDefinitions = {};
  cachedStaticFilesCompletionItems = [];
  for (const uri of uris) {
    if (!uri.fsPath.includes("__")) {
      const label = uri.fsPath.split(/static\/|staticfiles\//)[1];
      if (!cachedStaticFilesDefinitions[label]) {
        cachedStaticFilesDefinitions[label] = [];
      }
      cachedStaticFilesDefinitions[label].push(uri);
    }
  }
  cachedStaticFilesCompletionItems = Object.keys(
    cachedStaticFilesDefinitions
  ).map((label) => ({
    label,
    kind: vscode.CompletionItemKind.File,
    insertText: label,
  }));
  cachedLastUpdatedTime = new Date().getTime();
  return cachedStaticFilesCompletionItems;
}

async function getOrUpdateCompletionItems() {
  const now = new Date().getTime();
  if (
    now - cachedLastUpdatedTime < cacheSeconds * 1000 &&
    cachedStaticFilesCompletionItems.length > 0
  ) {
    return cachedStaticFilesCompletionItems;
  }
  try {
    return await updateCachedStaticFiles();
  } catch (error) {
    console.error(error);
    return [];
  }
}

function createAutocompletionProvider(config: types.ProviderConfig) {
  const languageFilters = createDocumentFiltersForExtensions(config.extensions);
  const regexPattern = createEndsWithRegex(config.checks);
  return vscode.languages.registerCompletionItemProvider(
    languageFilters,
    {
      async provideCompletionItems(document, position, _, context) {
        const line = getCleanedLine(document, position, linesToCheck);
        if (regexPattern.test(line)) {
          return await getOrUpdateCompletionItems();
        }
        return [];
      },
    },
    ...triggers
  );
}

async function definitionProviderForStaticFiles(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const wordRange = document.getWordRangeAtPosition(position);
  if (!wordRange || wordRange.isEmpty) {
    return [];
  }
  let partialWord = document.getText(wordRange);
  const completeWord = getCompleteWordFromLine(
    document,
    position.line,
    partialWord
  );
  if (completeWord) {
    partialWord = completeWord;
  }
  await getOrUpdateCompletionItems();
  if (partialWord in cachedStaticFilesDefinitions) {
    return cachedStaticFilesDefinitions[partialWord].map((uri) => ({
      uri,
      range: fileBeginningRange,
    }));
  }
  return [];
}

function activateDefinitionProviderForStaticFiles() {
  const languageFilters = createDocumentFiltersForExtensions([
    "html",
    "js",
    "css",
    "py",
  ]);
  return vscode.languages.registerDefinitionProvider(languageFilters, {
    provideDefinition: definitionProviderForStaticFiles,
  });
}

export async function activateStaticFilesAutocompletion(
  context: vscode.ExtensionContext
) {
  activateDefinitionProviderForStaticFiles();
  for (const config of configs) {
    const provider = createAutocompletionProvider(config);
    context.subscriptions.push(provider);
  }
}
