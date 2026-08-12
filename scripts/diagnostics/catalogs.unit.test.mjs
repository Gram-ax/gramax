import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { promisify } from "node:util";
import { createCatalogReport, parseArguments, resolveCatalogPath, sanitizeRemote } from "./catalogs.mjs";

const execFile = promisify(execFileCallback);
const fixtureRoot = await mkdtemp(join(tmpdir(), "gramax-catalog-diagnostics-"));

after(async () => {
	await rm(fixtureRoot, { recursive: true, force: true });
});

async function git(args, cwd) {
	return await execFile("git", cwd ? ["-C", cwd, ...args] : args);
}

async function createRepository(path) {
	await mkdir(join(path, "resources"), { recursive: true });
	await git(["init"], path);
	await git(["config", "user.email", "diagnostics@example.test"], path);
	await git(["config", "user.name", "Diagnostics"], path);
	await writeFile(join(path, "article.md"), "# Catalog\n");
	await writeFile(join(path, "resources", "manual.pdf"), "pdf");
	await writeFile(join(path, "resources", "diagram.mermaid"), "graph TD; A-->B");
	await git(["add", "."], path);
	await git(["commit", "-m", "Initial catalog"], path);
}

test("removes credentials and query parameters from remote URLs", () => {
	assert.equal(
		sanitizeRemote("https://login:secret@git.example.com/team/docs.git?private_token=token"),
		"git.example.com/team/docs.git",
	);
	assert.equal(sanitizeRemote("git@git.example.com:team/docs.git"), "git.example.com/team/docs.git");
});

test("parses root and catalog arguments without allowing paths outside root", () => {
	assert.deepEqual(parseArguments(["--root", "/data", "--catalog", "team/docs"]), {
		rootPath: "/data",
		catalogPath: "team/docs",
	});
	assert.throws(() => resolveCatalogPath("/data", "../etc"), /inside --root/);
});

test("reports ordinary and bare repositories without exposing credentials", async () => {
	const ordinaryPath = join(fixtureRoot, "ordinary-catalog");
	const barePath = join(fixtureRoot, "bare-catalog.git");
	await createRepository(ordinaryPath);
	await git(["remote", "add", "origin", "https://login:secret@git.example.com/team/docs.git?private_token=token"], ordinaryPath);
	await git(["clone", "--bare", ordinaryPath, barePath]);

	const beforeHead = (await git(["rev-parse", "HEAD"], ordinaryPath)).stdout.trim();
	const report = await createCatalogReport({ rootPath: fixtureRoot });
	const afterHead = (await git(["rev-parse", "HEAD"], ordinaryPath)).stdout.trim();

	assert.equal(afterHead, beforeHead);
	assert.equal(report.catalogs.length, 2);
	assert.equal(report.catalogs.find((catalog) => catalog.path === "ordinary-catalog")?.bare, false);
	assert.equal(report.catalogs.find((catalog) => catalog.path === "bare-catalog.git")?.bare, true);
	assert.equal(report.catalogs.find((catalog) => catalog.path === "ordinary-catalog")?.resources.byType.pdf.count, 1);
	assert.equal(report.catalogs.find((catalog) => catalog.path === "ordinary-catalog")?.resources.byType.mermaid.count, 1);
	assert.equal(JSON.stringify(report).includes("secret"), false);
	assert.equal(JSON.stringify(report).includes("private_token"), false);
});

test("keeps successful catalog diagnostics when another catalog is unreadable", async () => {
	const healthyPath = join(fixtureRoot, "healthy-catalog");
	const brokenPath = join(fixtureRoot, "broken-catalog.git");
	await createRepository(healthyPath);
	await mkdir(join(brokenPath, "objects"), { recursive: true });
	await mkdir(join(brokenPath, "refs"), { recursive: true });
	await writeFile(join(brokenPath, "HEAD"), "ref: refs/heads/main\n");

	const report = await createCatalogReport({ rootPath: fixtureRoot });

	assert.ok(report.catalogs.find((catalog) => catalog.path === "healthy-catalog")?.head);
	assert.ok(report.catalogs.find((catalog) => catalog.path === "broken-catalog.git")?.error);
});
