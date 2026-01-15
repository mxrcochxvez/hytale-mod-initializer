import * as vscode from "vscode";
import { runInitializeCommand } from "./commands/initialize";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "hytaleModInitializer.initialize",
    () => runInitializeCommand()
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  return undefined;
}
