import * as vscode from "vscode";
import * as types from "../types/main";
import {
  createDocumentFiltersForExtensions,
  createEndsWithRegex,
  getCleanedLine,
} from "./utils";

const cacheSeconds = 240;

const triggers = ['"', "'"];

const configs: types.ProviderConfig[] = [
  {
    extensions: ["py"],
    checks: [
      "reverse_lazy(",
      "reverse(",
      "url=",
      "url_name=",
      "url_name:",
      "url:",
    ],
  },
  { extensions: ["html"], checks: ["{%url", "url_name", "url"] },
];

type UrlConfig = {
  uri: vscode.Uri;
  name: string;
};

type UrlsConfigs = {
  [key: string]: UrlConfig[];
};

type UrlFileConfig = {
  uri: vscode.Uri;
  appName: string | null;
  urlNames: string[];
};

let cachedUrlsConfigs: vscode.CompletionItem[] = [];
let cachedLastUpdatedTime = new Date().getTime();

async function getUrlsFilesUris() {
  return await vscode.workspace.findFiles("**/urls.py");
}

async function getUrlsConfigsFromFile(uri: vscode.Uri): Promise<UrlFileConfig> {
  const data = (await vscode.workspace.fs.readFile(uri)).toString();
  const appNameRegex = /app_name\s*=\s*(.*)/;
  let appName = null;
  const appNameMatch = appNameRegex.exec(data);
  if (appNameMatch && appNameMatch[1]) {
    appName = appNameMatch[1].trim().replace(/['"]/g, "");
  }
  const nameArgRegex = /\b(name)( *=*)*[\'\"](.*)[\'\"]/g;
  const urlNames = [];
  let match;

  while ((match = nameArgRegex.exec(data)) !== null) {
    const urlName = match[match.length - 1].trim();
    if (urlName !== "") {
      urlNames.push(urlName);
    }
  }
  return { appName, urlNames, uri };
}

export async function updateUrlsConfigsCache() {
  const urls = await getUrlsFilesUris();
  cachedUrlsConfigs = [];
  for (const url of urls) {
    const configs = await getUrlsConfigsFromFile(url);
    for (const urlName of configs.urlNames) {
      const url = `${configs.appName}${configs.appName ? ":" : ""}${urlName}`;
      cachedUrlsConfigs.push({
        label: url,
        insertText: url,
        kind: vscode.CompletionItemKind.Text,
      });
    }
  }
  cachedLastUpdatedTime = new Date().getTime();
  return cachedUrlsConfigs;
}

async function getOrUpdateCompletionItems() {
  const now = new Date().getTime();
  if (
    now - cachedLastUpdatedTime < cacheSeconds * 1000 &&
    cachedUrlsConfigs.length > 0
  ) {
    return cachedUrlsConfigs;
  }
  try {
    return await updateUrlsConfigsCache();
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
        const line = getCleanedLine(document, position, 1);
        if (regexPattern.test(line)) {
          return await getOrUpdateCompletionItems();
        }
        return await Promise.resolve([]);
      },
    },
    ...triggers
  );
}

export async function activateUrlNamesAutocompletion(
  context: vscode.ExtensionContext
) {
  for (const config of configs) {
    const provider = createAutocompletionProvider(config);
    context.subscriptions.push(provider);
  }
}
