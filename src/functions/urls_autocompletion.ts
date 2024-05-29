import * as vscode from "vscode";
import * as types from "../types/main";

const cacheSeconds = 240;

const triggers = ['"', "'"];

const configs: types.ProviderConfig[] = [
  {
    extensions: ["py"],
    checks: ["reverse_lazy(", "reverse(", "url=", "url_name="],
  },
  { extensions: ["html"], checks: ["{%url"] },
];

type UrlConfig = {
  uri: vscode.Uri;
  name: string;
};

let cachedUrlsConfigs: UrlConfig[] = [];
