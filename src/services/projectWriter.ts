import * as fs from "fs/promises";
import * as path from "path";
import { ScaffoldInputs } from "../types";
import { toKebabCase } from "./naming";

export async function applyTemplate(inputs: ScaffoldInputs): Promise<void> {
  const javaRoot = path.join(inputs.targetDirectory, "src", "main", "java");
  const oldPackagePath = path.join(javaRoot, "dev", "hytalemodding");
  const newPackagePath = path.join(
    javaRoot,
    ...inputs.packageName.split(".")
  );

  await fs.mkdir(path.dirname(newPackagePath), { recursive: true });
  await movePackageDir(oldPackagePath, newPackagePath, javaRoot);

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

async function movePackageDir(
  oldPackagePath: string,
  newPackagePath: string,
  javaRoot: string
): Promise<void> {
  const resolvedOld = path.resolve(oldPackagePath);
  const resolvedNew = path.resolve(newPackagePath);

  if (resolvedOld === resolvedNew) {
    return;
  }

  const isSubdir = resolvedNew.startsWith(resolvedOld + path.sep);

  if (isSubdir) {
    const tempPath = path.join(javaRoot, "__package_tmp_move");
    await fs.rm(tempPath, { recursive: true, force: true });
    await fs.rename(oldPackagePath, tempPath);
    await fs.mkdir(path.dirname(newPackagePath), { recursive: true });
    await fs.rename(tempPath, newPackagePath);
    await cleanupEmptyParents(tempPath, javaRoot);
  } else {
    await fs.rename(oldPackagePath, newPackagePath);
  }

  await cleanupEmptyParents(oldPackagePath, javaRoot);
}
