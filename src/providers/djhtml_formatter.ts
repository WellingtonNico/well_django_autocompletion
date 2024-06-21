import * as vscode from "vscode";
import { runPythonCommand, getConfig, configSection } from "../utils";

export class DjhtmlFormatter implements vscode.DocumentFormattingEditProvider {
  readonly #context: vscode.ExtensionContext;
  readonly #outputChannel: vscode.LogOutputChannel;
  #providerDisposable: vscode.Disposable | undefined;

  constructor(
    context: vscode.ExtensionContext,
    outputChannel: vscode.LogOutputChannel
  ) {
    this.#context = context;
    this.#outputChannel = outputChannel;
  }

  activate(): void {
    this.#register();

    this.#context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(`${configSection}.djhtmlFormatLanguages`)) {
          this.#register();
        }
      })
    );
  }

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): Promise<vscode.TextEdit[] | undefined> {
    const config = getConfig();
    let stdout;
    try {
      stdout = await runPythonCommand(
        document,
        "-m",
        "djhtml",
        document.uri.fsPath,
        ...config.djhtmlFormatArgs
      );
    } catch (e) {
      console.log(e);
      return void 0;
    }
  }

  #register(): void {
    const languages = getConfig().djhtmlFormatLanguages;
    this.#providerDisposable?.dispose();
    if (Array.isArray(languages)) {
      this.#providerDisposable =
        vscode.languages.registerDocumentFormattingEditProvider(
          languages,
          this
        );
      this.#context.subscriptions.push(this.#providerDisposable);
    }
  }
}
