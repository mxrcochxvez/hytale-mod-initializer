import * as vscode from "vscode";
import { ScaffoldInputs } from "../types";
import { toPackageSegment, toPascalCase } from "./naming";

export async function gatherInputs(): Promise<ScaffoldInputs | undefined> {
  const targetDirUri = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: "Select target folder for the mod"
  });

  if (!targetDirUri || targetDirUri.length === 0) {
    return undefined;
  }

  const groupId = await promptRequired("Group ID (org)", "dev.hytalemodding");
  if (!groupId) {
    return undefined;
  }

  const modName = await promptRequired("Mod name", "MyHytaleMod");
  if (!modName) {
    return undefined;
  }

  const defaultPackage = `${groupId}.${toPackageSegment(modName)}`;
  const packageName = await promptRequired("Java package name", defaultPackage);
  if (!packageName) {
    return undefined;
  }

  const defaultClass = toPascalCase(modName);
  const mainClassName = await promptRequired(
    "Main class name",
    defaultClass
  );
  if (!mainClassName) {
    return undefined;
  }

  const authorName = await promptRequired("Author name", "Your Name");
  if (!authorName) {
    return undefined;
  }

  const authorEmail = await promptOptional("Author email", "");
  if (authorEmail === undefined) {
    return undefined;
  }

  const authorUrl = await promptOptional("Author URL", "");
  if (authorUrl === undefined) {
    return undefined;
  }

  const description = await promptRequired(
    "Mod description",
    `Hytale mod: ${modName}`
  );
  if (!description) {
    return undefined;
  }

  return {
    targetDirectory: targetDirUri[0].fsPath,
    groupId,
    modName,
    packageName,
    mainClassName,
    authorName,
    authorEmail,
    authorUrl,
    description
  };
}

async function promptRequired(
  prompt: string,
  value: string
): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt,
    value,
    ignoreFocusOut: true,
    validateInput: (input) => (input.trim().length === 0 ? "Required" : null)
  });
}

async function promptOptional(
  prompt: string,
  value: string
): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt,
    value,
    ignoreFocusOut: true
  });
}
