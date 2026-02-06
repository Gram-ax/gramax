import fs from "node:fs/promises";
import { dirname } from "node:path";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dist = path.join(__dirname, "dist");

fs.copyFile(path.join(__dirname, "Readme.md"), path.join(dist, "Readme.md"));

fs.copyFile(path.join(dirname(dirname(__dirname)), "LICENSE"), path.join(dist, "LICENSE"));

async function generatePackageJson() {
	const templatePackagePath = path.join(dist, "package.json");
	const templatePackageJson = JSON.parse(await fs.readFile(templatePackagePath, "utf8"));

	const version = process.env.GRAMAX_VERSION;

	templatePackageJson.version = version;

	await fs.writeFile(templatePackagePath, JSON.stringify(templatePackageJson, null, 2));
}

await generatePackageJson();
