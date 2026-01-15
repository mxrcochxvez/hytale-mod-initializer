import * as https from "https";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as unzipper from "unzipper";
import { TEMPLATE_ROOT_DIR, TEMPLATE_ZIP_URL } from "../constants/template";

export async function downloadTemplate(zipPath: string): Promise<void> {
  await fetchToFile(TEMPLATE_ZIP_URL, zipPath, 5);
}

async function fetchToFile(
  url: string,
  zipPath: string,
  redirectsLeft: number
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = https.get(url, (response) => {
      const status = response.statusCode ?? 0;
      const location = response.headers?.location;

      if ([301, 302, 303, 307, 308].includes(status) && location) {
        if (redirectsLeft <= 0) {
          response.resume();
          reject(new Error("Too many redirects when downloading template"));
          return;
        }
        response.resume();
        const nextUrl = new URL(location, url).toString();
        fetchToFile(nextUrl, zipPath, redirectsLeft - 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (status !== 200 || !response.headers) {
        reject(new Error(`Failed to download template (status ${status})`));
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
