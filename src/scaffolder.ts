import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as https from "https";
import * as unzipper from "unzipper";

const TEMPLATE_ZIP_URL =
  "https://github.com/HytaleModding/plugin-template/archive/refs/heads/main.zip";

interface ScaffoldInputs {
  targetDirectory: string;
  groupId: string;
  modName: string;
  packageName: string;
  mainClassName: string;
  authorName: string;
  authorEmail: string;
  authorUrl: string;
  description: string;
}

export async function scaffoldHytaleMod(): Promise<void> {
  try {
    const inputs = await gatherInputs();
    if (!inputs) {
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Scaffolding Hytale mod",
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: "Downloading template" });
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hytale-mod-"));
        const zipPath = path.join(tempDir, "template.zip");

        await downloadTemplate(zipPath);

        progress.report({ message: "Extracting template" });
        await extractZip(zipPath, tempDir);

        const extractedRoot = path.join(tempDir, "plugin-template-main");
        await copyTemplate(extractedRoot, inputs.targetDirectory);

        progress.report({ message: "Applying configuration" });
        await applyReplacements(inputs);

        await fs.rm(tempDir, { recursive: true, force: true });
      }
    );

    vscode.window.showInformationMessage(
      `Hytale mod initialized at ${inputs.targetDirectory}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to scaffold mod: ${message}`);
  }
}

async function gatherInputs(): Promise<ScaffoldInputs | undefined> {
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

async function downloadTemplate(zipPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = https.get(TEMPLATE_ZIP_URL, (response) => {
      if (response.statusCode !== 200 || !response.headers) {
        reject(
          new Error(
            `Failed to download template (status ${response.statusCode})`
          )
        );
        response.resume();
        return;
      }

      const fileStream = fsSync.createWriteStream(zipPath);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });

      fileStream.on("error", reject);
    });

    request.on("error", reject);
  });
}

async function extractZip(zipPath: string, destination: string): Promise<void> {
  await fsSync
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: destination }))
    .promise();
}

async function copyTemplate(source: string, destination: string): Promise<void> {
  await fs.cp(source, destination, {
    recursive: true,
    filter: (src) => path.basename(src) !== ".idea"
  });
}

async function applyReplacements(inputs: ScaffoldInputs): Promise<void> {
  const javaRoot = path.join(inputs.targetDirectory, "src", "main", "java");
  const oldPackagePath = path.join(javaRoot, "dev", "hytalemodding");
  const newPackagePath = path.join(
    javaRoot,
    ...inputs.packageName.split(".")
  );

  await fs.mkdir(path.dirname(newPackagePath), { recursive: true });
  await fs.rename(oldPackagePath, newPackagePath);

  await cleanupEmptyParents(oldPackagePath, javaRoot);

  const commandClassName = `${inputs.mainClassName}Command`;
  const eventClassName = `${inputs.mainClassName}Event`;
  const commandName = toKebabCase(inputs.modName);

  const pluginPath = path.join(newPackagePath, "ExamplePlugin.java");
  const commandPath = path.join(newPackagePath, "commands", "ExampleCommand.java");
  const eventPath = path.join(newPackagePath, "events", "ExampleEvent.java");

  await replaceInFile(pluginPath, [
    ["package dev.hytalemodding;", `package ${inputs.packageName};`],
    ["ExamplePlugin", inputs.mainClassName],
    ["ExampleCommand", commandClassName],
    ["ExampleEvent", eventClassName],
    [
      "new ExampleCommand(\"example\", \"An example command\")",
      `new ${commandClassName}(\"${commandName}\", \"Command for ${inputs.modName}\")`
    ]
  ]);

  await replaceInFile(commandPath, [
    ["package dev.hytalemodding.commands;", `package ${inputs.packageName}.commands;`],
    ["ExampleCommand", commandClassName],
    ["Hello from ExampleCommand!", `Hello from ${commandClassName}!`]
  ]);

  await replaceInFile(eventPath, [
    ["package dev.hytalemodding.events;", `package ${inputs.packageName}.events;`],
    ["ExampleEvent", eventClassName]
  ]);

  const newPluginPath = path.join(newPackagePath, `${inputs.mainClassName}.java`);
  const newCommandPath = path.join(
    newPackagePath,
    "commands",
    `${commandClassName}.java`
  );
  const newEventPath = path.join(
    newPackagePath,
    "events",
    `${eventClassName}.java`
  );

  await fs.rename(pluginPath, newPluginPath);
  await fs.rename(commandPath, newCommandPath);
  await fs.rename(eventPath, newEventPath);

  const pomPath = path.join(inputs.targetDirectory, "pom.xml");
  await replaceInFile(pomPath, [
    ["<groupId>dev.hytalemodding</groupId>", `<groupId>${inputs.groupId}</groupId>`],
    ["<artifactId>ExamplePlugin</artifactId>", `<artifactId>${inputs.modName}</artifactId>`]
  ]);

  const manifestPath = path.join(
    inputs.targetDirectory,
    "src",
    "main",
    "resources",
    "manifest.json"
  );

  await replaceInFile(manifestPath, [
    ["\"Group\": \"dev.hytalemodding\"", `"Group": "${inputs.groupId}"`],
    ["\"Name\": \"ExamplePlugin\"", `"Name": "${inputs.modName}"`],
    ["\"Description\": \"Description of your plugin\"", `"Description": "${inputs.description}"`],
    ["\"Name\": \"Your Name\"", `"Name": "${inputs.authorName}"`],
    ["\"Email\": \"your.email@example.com\"", `"Email": "${inputs.authorEmail}"`],
    ["\"Url\": \"https://your-website.com\"", `"Url": "${inputs.authorUrl}"`],
    [
      "\"Main\": \"dev.hytalemodding.ExamplePlugin\"",
      `"Main": "${inputs.packageName}.${inputs.mainClassName}"`
    ]
  ]);
}

async function replaceInFile(
  filePath: string,
  replacements: Array<[string, string]>
): Promise<void> {
  let contents = await fs.readFile(filePath, "utf8");

  for (const [from, to] of replacements) {
    contents = contents.split(from).join(to);
  }

  await fs.writeFile(filePath, contents, "utf8");
}

async function cleanupEmptyParents(
  fromPath: string,
  stopAt: string
): Promise<void> {
  let current = path.dirname(fromPath);
  const stop = path.resolve(stopAt);

  while (path.resolve(current).startsWith(stop)) {
    try {
      const entries = await fs.readdir(current);
      if (entries.length > 0) {
        break;
      }
      await fs.rmdir(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }
}

function toPascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

function toPackageSegment(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((segment) => segment.toLowerCase())
    .join("");
}

function toKebabCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
