import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import { gatherInputs } from "../services/inputPrompts";
import { downloadTemplate, extractZip, copyExtractedTemplate } from "../services/templateFetcher";
import { applyTemplate } from "../services/projectWriter";

export async function runInitializeCommand(): Promise<void> {
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

        progress.report({ message: "Copying files" });
        await copyExtractedTemplate(tempDir, inputs.targetDirectory);

        progress.report({ message: "Applying configuration" });
        await applyTemplate(inputs);

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
