import { spawn } from "node:child_process";
import { lstat, readdir, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const GIT_TIMEOUT_MS = 30_000;
const MAX_GIT_OUTPUT_BYTES = 64 * 1024 * 1024;
const LARGE_RESOURCE_BYTES = 100 * 1024 * 1024;
const LARGE_GIT_STORE_BYTES = 10 * 1024 * 1024 * 1024;
const MANY_RESOURCES_COUNT = 1_000;
const MAX_LARGEST_FILES = 10;
const RESOURCE_TYPES = {
	pdf: new Set(["pdf"]),
	docx: new Set(["docx"]),
	svg: new Set(["svg"]),
	mermaid: new Set(["mermaid", "mmd"]),
};
const DOCUMENT_EXTENSIONS = new Set(["md", "mdx", "markdown", "yaml", "yml", "json", "txt"]);

export async function createCatalogReport({ rootPath = process.env.ROOT_PATH, catalogPath, environment = process.env }) {
	if (!rootPath) throw new Error("ROOT_PATH is not set; pass --root <path>.");

	const absoluteRootPath = resolve(rootPath);
	const repositoryPaths = catalogPath
		? [await resolveRepositoryPath(absoluteRootPath, catalogPath)]
		: await discoverRepositories(absoluteRootPath);
	const catalogs = await Promise.all(repositoryPaths.map((repositoryPath) => inspectRepositorySafely(absoluteRootPath, repositoryPath)));

	return {
		generatedAt: new Date().toISOString(),
		rootPath: absoluteRootPath,
		runtime: {
			autoPullInterval: environment.AUTO_PULL_INTERVAL || null,
			resourceSearchEnabled: environment.RESOURCE_SEARCH_ENABLED !== "false",
		},
		summary: summarizeCatalogs(catalogs),
		catalogs,
	};
}

export function sanitizeRemote(value) {
	if (!value) return null;
	const input = value.trim();
	if (!input) return null;

	try {
		const url = new URL(input);
		if (url.protocol === "file:") return "local";
		return `${url.host}${url.pathname}`.replace(/\/$/, "") || null;
	} catch {}

	const scpStyle = input.match(/^(?:[^@\s]+@)?([^:\s/]+):\/?(.+)$/);
	if (scpStyle) return `${scpStyle[1]}/${scpStyle[2].replace(/[?#].*$/, "")}`.replace(/\/$/, "");

	return null;
}

export function resolveCatalogPath(rootPath, catalogPath) {
	if (!catalogPath || isAbsolute(catalogPath)) throw new Error("--catalog must be a relative path inside --root.");

	const resolvedPath = resolve(rootPath, catalogPath);
	const relativePath = relative(rootPath, resolvedPath);
	if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
		throw new Error("--catalog must be a path inside --root.");
	}

	return resolvedPath;
}

export function parseArguments(args) {
	const options = {};
	for (let index = 0; index < args.length; index++) {
		const argument = args[index];
		if (argument === "--help" || argument === "-h") return { help: true };
		if (argument !== "--root" && argument !== "--catalog") {
			throw new Error(`Unknown argument: ${argument}`);
		}

		const value = args[++index];
		if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
		options[argument === "--root" ? "rootPath" : "catalogPath"] = value;
	}
	return options;
}

async function discoverRepositories(rootPath) {
	const repositories = [];

	async function walk(path) {
		const repository = await identifyRepository(path);
		if (repository) {
			repositories.push(repository);
			return;
		}

		const entries = await readdir(path, { withFileTypes: true });
		for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
			if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith(".")) continue;
			await walk(join(path, entry.name));
		}
	}

	await walk(rootPath);
	return repositories;
}

async function resolveRepositoryPath(rootPath, catalogPath) {
	const repositoryPath = resolveCatalogPath(rootPath, catalogPath);
	const repository = await identifyRepository(repositoryPath);
	if (!repository) throw new Error("--catalog does not point to a Git repository.");
	return repository;
}

async function identifyRepository(path) {
	const pathStat = await stat(path).catch(() => null);
	if (!pathStat?.isDirectory()) return null;

	if (await isBareRepository(path)) return { absolutePath: path, bare: true };
	if (await hasGitDirectory(path)) return { absolutePath: path, bare: false };
	return null;
}

async function isBareRepository(path) {
	const [head, objects, refs] = await Promise.all([
		lstat(join(path, "HEAD")).catch(() => null),
		lstat(join(path, "objects")).catch(() => null),
		lstat(join(path, "refs")).catch(() => null),
	]);
	return head?.isFile() && objects?.isDirectory() && refs?.isDirectory();
}

async function hasGitDirectory(path) {
	const gitPath = await lstat(join(path, ".git")).catch(() => null);
	return Boolean(gitPath?.isDirectory() || gitPath?.isFile());
}

async function inspectRepositorySafely(rootPath, repository) {
	const path = relative(rootPath, repository.absolutePath) || ".";
	try {
		return await inspectRepository(path, repository);
	} catch (error) {
		return {
			path,
			bare: repository.bare,
			error: {
				code: "repository-inspection-failed",
				message: sanitizeText(error instanceof Error ? error.message : String(error)),
			},
		};
	}
}

async function inspectRepository(path, repository) {
	const head = await runGit(repository, ["rev-parse", "HEAD"]);
	const [branch, remote, countObjects, tree] = await Promise.all([
		runGitOptional(repository, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
		runGitOptional(repository, ["remote", "get-url", "origin"]),
		runGit(repository, ["count-objects", "-v"]),
		runGit(repository, ["ls-tree", "-r", "-l", "-z", "HEAD"]),
	]);
	const files = aggregateTree(tree);
	const lfs = await inspectLfs(repository);
	const gitObjectBytes = parseGitObjectBytes(countObjects);

	return {
		path,
		bare: repository.bare,
		branch: branch || null,
		head,
		git: {
			objectBytes: gitObjectBytes,
			remote: sanitizeRemote(remote),
		},
		files: {
			count: files.count,
			bytes: files.bytes,
			byExtension: files.byExtension,
			largest: files.largest,
		},
		resources: files.resources,
		lfs,
		warnings: buildWarnings(files, gitObjectBytes),
	};
}

async function inspectLfs(repository) {
	const attributes = await runGitOptional(repository, ["show", "HEAD:.gitattributes"]);
	return {
		enabled: Boolean(attributes?.includes("filter=lfs")),
	};
}

function aggregateTree(treeOutput) {
	const byExtension = {};
	const resources = {
		count: 0,
		bytes: 0,
		byType: Object.fromEntries(Object.keys(RESOURCE_TYPES).map((type) => [type, { count: 0, bytes: 0 }])),
	};
	const largest = [];
	let count = 0;
	let bytes = 0;

	for (const entry of treeOutput.split("\0")) {
		if (!entry) continue;
		const parsed = parseTreeEntry(entry);
		if (!parsed || parsed.type !== "blob") continue;

		count++;
		bytes += parsed.bytes;
		const extension = getExtension(parsed.path);
		const extensionStats = (byExtension[extension] ??= { count: 0, bytes: 0 });
		extensionStats.count++;
		extensionStats.bytes += parsed.bytes;

		if (!DOCUMENT_EXTENSIONS.has(extension)) {
			resources.count++;
			resources.bytes += parsed.bytes;
		}
		for (const [type, extensions] of Object.entries(RESOURCE_TYPES)) {
			if (!extensions.has(extension)) continue;
			resources.byType[type].count++;
			resources.byType[type].bytes += parsed.bytes;
		}

		largest.push({ path: parsed.path, bytes: parsed.bytes, extension });
	}

	largest.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
	return { count, bytes, byExtension, largest: largest.slice(0, MAX_LARGEST_FILES), resources };
}

function parseTreeEntry(entry) {
	const tabIndex = entry.indexOf("\t");
	if (tabIndex < 0) return null;
	const [mode, type, objectId, size] = entry.slice(0, tabIndex).split(" ");
	if (!mode || !type || !objectId || size === undefined) return null;
	return { type, path: entry.slice(tabIndex + 1), bytes: Number(size) || 0 };
}

function getExtension(path) {
	const fileName = path.split("/").pop() ?? "";
	const index = fileName.lastIndexOf(".");
	return index > 0 && index < fileName.length - 1 ? fileName.slice(index + 1).toLowerCase() : "[none]";
}

function parseGitObjectBytes(output) {
	const values = Object.fromEntries(
		output
			.trim()
			.split("\n")
			.map((line) => line.split(":", 2))
			.map(([key, value]) => [key, Number(value?.trim()) || 0]),
	);
	return (values.size + values["size-pack"] + values["size-garbage"]) * 1024;
}

function buildWarnings(files, gitObjectBytes) {
	const warnings = [];
	if (files.resources.count >= MANY_RESOURCES_COUNT) warnings.push("many-resources");
	if (files.largest.some((file) => file.bytes >= LARGE_RESOURCE_BYTES)) warnings.push("large-resource-file");
	if (gitObjectBytes >= LARGE_GIT_STORE_BYTES) warnings.push("large-git-store");
	return warnings;
}

function summarizeCatalogs(catalogs) {
	const successful = catalogs.filter((catalog) => !catalog.error);
	return {
		catalogs: catalogs.length,
		bareRepositories: successful.filter((catalog) => catalog.bare).length,
		failedCatalogs: catalogs.length - successful.length,
		files: successful.reduce((total, catalog) => total + catalog.files.count, 0),
		resourceFiles: successful.reduce((total, catalog) => total + catalog.resources.count, 0),
		resourceBytes: successful.reduce((total, catalog) => total + catalog.resources.bytes, 0),
		warnings: successful.reduce((total, catalog) => total + catalog.warnings.length, 0),
	};
}

async function runGitOptional(repository, args) {
	try {
		return await runGit(repository, args);
	} catch {
		return null;
	}
}

async function runGit(repository, args) {
	const repositoryArgs = repository.bare
		? [`--git-dir=${repository.absolutePath}`, ...args]
		: ["-C", repository.absolutePath, ...args];
	return await runProcess("git", repositoryArgs);
}

async function runProcess(command, args) {
	return await new Promise((resolveOutput, rejectOutput) => {
		const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
		const stdout = [];
		const stderr = [];
		let outputBytes = 0;
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			child.kill("SIGTERM");
		}, GIT_TIMEOUT_MS);

		const append = (target, chunk) => {
			outputBytes += chunk.length;
			if (outputBytes > MAX_GIT_OUTPUT_BYTES) child.kill("SIGTERM");
			else target.push(chunk);
		};
		child.stdout.on("data", (chunk) => append(stdout, chunk));
		child.stderr.on("data", (chunk) => append(stderr, chunk));
		child.on("error", (error) => {
			clearTimeout(timer);
			rejectOutput(error);
		});
		child.on("close", (code) => {
			clearTimeout(timer);
			if (timedOut) return rejectOutput(new Error("Git command timed out after 30 seconds."));
			if (outputBytes > MAX_GIT_OUTPUT_BYTES) return rejectOutput(new Error("Git command output exceeds 64 MiB."));
			if (code !== 0) return rejectOutput(new Error(Buffer.concat(stderr).toString("utf8").trim() || "Git command failed."));
			resolveOutput(Buffer.concat(stdout).toString("utf8").trim());
		});
	});
}

function sanitizeText(value) {
	return value
		.replace(/(?:https?|ssh):\/\/[^\s'"`]+/g, (url) => sanitizeRemote(url) ?? "[redacted-url]")
		.replace(/\b(?:private_)?token=[^\s&]+/gi, "token=[redacted]")
		.replace(/\b[^\s@/:]+@[^\s/:]+:[^\s]+/g, "[redacted-remote]");
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
	try {
		const options = parseArguments(process.argv.slice(2));
		if (options.help) {
			process.stdout.write("Usage: node catalogs.mjs [--root <path>] [--catalog <relative-path>]\n");
		} else {
			const report = await createCatalogReport(options);
			process.stdout.write(`${JSON.stringify(report)}\n`);
		}
	} catch (error) {
		process.stderr.write(`${sanitizeText(error instanceof Error ? error.message : String(error))}\n`);
		process.exitCode = 1;
	}
}
