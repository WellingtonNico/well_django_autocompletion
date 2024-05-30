import * as vscode from "vscode";
import * as types from "../types/main";
import {
  createDocumentFiltersForExtensions,
  createEndsWithRegex,
  getCleanedLine,
} from "./utils";

const cacheSeconds = 240;

const triggers = ['"', "'"];

const linesToCheck = 1;

const configs: types.ProviderConfig[] = [
  { extensions: ["html", "py"], checks: ["{%static", "{%extends"] },
];

type CleanedFiles = {
  [key: string]: vscode.Uri[];
};

let cachedStaticFilesCompletionItems: vscode.CompletionItem[] = [];
let cachedStaticFilesCompletions: CleanedFiles = {};
let cachedLastUpdatedTime = new Date().getTime();

async function getStaticFilesUris() {
  return [
    ...(await vscode.workspace.findFiles("**/static/**/*")),
    ...(await vscode.workspace.findFiles("**/staticfiles/**/*")),
  ];
}

export async function updateCachedStaticFiles() {
  const uris = await getStaticFilesUris();
  cachedStaticFilesCompletions = {};
  cachedStaticFilesCompletionItems = [];
  for (const uri of uris) {
    if (!uri.fsPath.includes("__")) {
      const label = uri.fsPath.split(/static\/|staticfiles\//)[1];
      if (!cachedStaticFilesCompletions[label]) {
        cachedStaticFilesCompletions[label] = [];
      }
      cachedStaticFilesCompletions[label].push(uri);
    }
  }
  cachedStaticFilesCompletionItems = Object.keys(
    cachedStaticFilesCompletions
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

export async function activateStaticFilesAutocompletion(
  context: vscode.ExtensionContext
) {
  for (const config of configs) {
    const provider = createAutocompletionProvider(config);
    context.subscriptions.push(provider);
  }
}
