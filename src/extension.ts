import * as vscode from "vscode";
import { scaffoldHytaleMod } from "./scaffolder";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "hytaleModInitializer.initialize",
    () => scaffoldHytaleMod()
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  return undefined;
}
