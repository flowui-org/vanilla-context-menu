import path from "node:path";
import fs from "node:fs/promises";
import fse, { ensureDir, remove } from "fs-extra";
import { execa } from "execa";
import { step } from "./utils.mjs";
import appRoot from "app-root-path";
import semver from "semver";

const rootDirectory = appRoot.path;
const configDirectory = path.join(rootDirectory, "config");
const sourceDirectory = path.join(rootDirectory, "src");
const distributionDirectory = path.join(rootDirectory, "dist");

const clean = step("Clean output directory", async () => {
  await remove(distributionDirectory);
});

const buildTypeDeclarations = step("Build type declarations", async () => {
  await execa(
    "tsc",
    ["--project", `"${path.join(configDirectory, "tsconfig.json")}"`],
    { shell: true },
  );
});

async function getSourceFiles() {
  const sources = [];
  const walk = async (dir) => {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && /\.[tj]sx?$/.test(path.extname(file.name))) {
        sources.push(path.join(dir, file.name));
      } else if (file.isDirectory()) {
        await walk(path.join(dir, file.name));
      }
    }
  };
  await walk(sourceDirectory);
  return sources;
}

async function transformFiles({ env, outputDir }) {
  await execa(
    "babel",
    [
      `"${sourceDirectory}"`,
      "--extensions .ts",
      "--config-file",
      `"${path.join(configDirectory, "babel-config.js")}"`,
      "--out-dir",
      `"${path.join(distributionDirectory, outputDir)}"`,
      "--env-name",
      `"${env}"`,
    ],
    { shell: true },
  );
}

const buildUmd = step("Build 'umd' modules", async () => {
  await execa("webpack", ["--config", "config/webpack-lib.config.js"], {
    shell: true,
  });
});

const buildCjs = step("Build 'cjs' modules", async () => {
  await transformFiles({ env: "commonjs", outputDir: "cjs" });
});

const buildEsm = step("Build 'esm' modules", async () => {
  await transformFiles({ env: "esm", outputDir: "esm" });
});

function createProxyFile(file) {
  const relativePath = path.relative(file.src, sourceDirectory);
  const root = file.index ? path.dirname(relativePath) : relativePath;
  return {
    main: path.join(root, "cjs", file.dirname, `${file.filename}.js`),
    module: path.join(root, "esm", file.dirname, `${file.filename}.js`),
    types: path.join(root, "types", file.dirname, `${file.filename}.d.ts`),
  };
}

function getSourceFileInfo(src) {
  return {
    src,
    dirname: path.dirname(src).replace(sourceDirectory, ""),
    filename: path.parse(src).name,
    index: path.parse(src).name === "index",
  };
}

const writeNodeProxyFiles = step("Write node proxy files", async () => {
  const sources = await getSourceFiles();
  const proxyFiles = sources.map(getSourceFileInfo);
  for (const file of proxyFiles) {
    const dirname = path.join(
      distributionDirectory,
      file.dirname,
      file.index ? "" : file.filename,
    );
    await ensureDir(dirname);
    const filename = path.join(dirname, "package.json");
    await fse.writeJson(filename, createProxyFile(file), { spaces: 2 });
  }
});

const copyStaticFiles = step("Copy static files", async () => {
  const packageJson = await fse.readJson(
    path.join(rootDirectory, "package.json"),
  );
  await fse.writeJson(
    path.join(distributionDirectory, "package.json"),
    { ...packageJson, scripts: {} },
    { spaces: 2 },
  );
});

function getVersion() {
  const index = process.argv.findIndex((arg) => arg === "--version");
  const version = process.argv[index + 1];
  return [
    "ignore",
    "major",
    "minor",
    "patch",
    "premajor",
    "preminor",
    "prepatch",
    "prerelease",
  ].includes(version)
    ? version
    : "minor";
}

const updatePackageVersion = step("Upgrade version", async () => {
  const packageJson = await fse.readJson(
    path.join(rootDirectory, "package.json"),
  );
  packageJson.version = semver.inc(packageJson.version, getVersion(), "alpha");
  await fse.writeJson(path.join(rootDirectory, "package.json"), packageJson, {
    spaces: 2,
  });
});

step("Build library", async () => {
  await clean();
  await buildTypeDeclarations();
  await Promise.all([buildUmd(), buildCjs(), buildEsm()]);
  await writeNodeProxyFiles();
  if (getVersion() !== "ignore") {
    await updatePackageVersion();
  }
  await copyStaticFiles();
})();
