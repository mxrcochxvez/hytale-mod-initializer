import * as https from "https";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as unzipper from "unzipper";
import { TEMPLATE_ROOT_DIR, TEMPLATE_ZIP_URL } from "../constants/template";

export async function downloadTemplate(zipPath: string): Promise<void> {
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

export async function extractZip(zipPath: string, destination: string): Promise<void> {
  await fsSync
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: destination }))
    .promise();
}

export async function copyExtractedTemplate(
  tempDir: string,
  targetDirectory: string
): Promise<void> {
  const extractedRoot = path.join(tempDir, TEMPLATE_ROOT_DIR);
  await fs.cp(extractedRoot, targetDirectory, {
    recursive: true,
    filter: (src) => path.basename(src) !== ".idea"
  });
}
