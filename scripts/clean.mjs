import { readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import appRoot from "app-root-path";
import chalk from "chalk";
import { step } from "./utils.mjs";

const ignoreList = [".git", ".github", ".idea"];
const directoryNamesToDelete = ["node_modules", "dist"];
const fileNamesToDelete = ["tsconfig.tsbuildinfo"];

const isDryRun = process.argv.includes("--dry-run");

async function deleteFileOrDirectory(path) {
  if (!isDryRun) {
    await rm(path, {
      recursive: true,
      force: true,
    });
  }
  console.log(chalk.gray(path));
}

async function traverseDirectory(path) {
  const files = await readdir(resolve(path), {
    withFileTypes: true,
  });

  for (const file of files) {
    if (ignoreList.includes(file.name)) continue;

    const fullPath = join(path, file.name);
    if (file.isDirectory()) {
      if (directoryNamesToDelete.includes(file.name)) {
        await deleteFileOrDirectory(fullPath);
      } else {
        await traverseDirectory(fullPath);
      }
    }

    if (file.isFile() && fileNamesToDelete.includes(file.name)) {
      await deleteFileOrDirectory(fullPath);
    }
  }
}

async function cleanWorkspace() {
  await traverseDirectory(appRoot.path);
}

step(`Cleaning workspace ${isDryRun ? "(dry)" : ""}`, cleanWorkspace)();
