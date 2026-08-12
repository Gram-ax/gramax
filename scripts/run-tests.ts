#!/usr/bin/env bun
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { type Subprocess, spawn } from "bun";

const require = createRequire(import.meta.url);
const { testGitCatalogUtils } = require("../core/extensions/git/test/testGitCatalogUtils") as {
	testGitCatalogUtils: { initGit: () => void; removeGit: () => void };
};

const ROOT = process.cwd();
const FIXTURES_PATH = join(ROOT, "core/extensions/git/test/fixtures");
const MOCK_SERVER_PID = join(FIXTURES_PATH, "git-http-mock-server.pid");
const JEST_BIN = join(ROOT, "node_modules/.bin/jest");
const BUN_NODE_SHIM = join(ROOT, "scripts/jest/bunNodeShim.js");
const MOCK_SERVER_BIN = join(ROOT, "node_modules/.bin/git-http-mock-server");

process.env.ROOT_PATH = join(ROOT, "app/test/docs");
process.env.PRODUCTION = "false";
process.env.VITE_ENVIRONMENT = "test";

const TEST_TYPES: Record<string, { match: string; env?: Record<string, string> }> = {
	unit: { match: "**/*.unit.test.ts" },
	int: { match: "**/*.int.test.ts" },
	ges: { match: "**/*.ges.test.ts", env: { JEST_INCLUDE_GES: "1", NODE_TLS_REJECT_UNAUTHORIZED: "0" } },
};

const rawArgs = process.argv.slice(2);
const noServerIdx = rawArgs.findIndex((a) => a === "--no-server" || a === "-n");
const useServer = noServerIdx === -1;
if (!useServer) rawArgs.splice(noServerIdx, 1);

const jestArgs = ["--reporters=default", "--reporters=jest-junit", "--ci", "--runInBand", "--forceExit", "-u"];
const type = rawArgs[0] ? TEST_TYPES[rawArgs[0]] : undefined;
if (type) {
	jestArgs.push("--testMatch", type.match);
	if (type.env) Object.assign(process.env, type.env);
	rawArgs.shift();
}
jestArgs.push(...rawArgs);

// `node_modules/.bin/jest` starts with `#!/usr/bin/env node`. Where `node` is bun (the
// oven/bun image symlinks it), jest needs a preload shim to start at all — so run it
// through this bun explicitly. Real node: leave the shebang alone.
const nodeIsBun = (): boolean => {
	try {
		const probe = Bun.spawnSync(["node", "--version"]);
		return !/^v\d+\./.test(probe.stdout.toString().trim());
	} catch {
		return true; // no node at all — bun is what we have
	}
};

const jestCommand = (args: string[]): string[] =>
	nodeIsBun() ? [process.execPath, "--preload", BUN_NODE_SHIM, JEST_BIN, ...args] : [JEST_BIN, ...args];

const isAlive = (pid: number): boolean => {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};

async function stopMockServer(): Promise<void> {
	if (!existsSync(MOCK_SERVER_PID)) return;
	const pid = parseInt(readFileSync(MOCK_SERVER_PID, "utf8").trim(), 10);
	if (Number.isFinite(pid) && isAlive(pid)) {
		try {
			process.kill(pid, "SIGTERM");
		} catch {}
		for (let i = 0; i < 20 && isAlive(pid); i++) await Bun.sleep(100);
		if (isAlive(pid)) {
			try {
				process.kill(pid, "SIGKILL");
			} catch {}
		}
	}
	try {
		unlinkSync(MOCK_SERVER_PID);
	} catch {}
}

async function resetFixtures(label: string): Promise<void> {
	await stopMockServer();
	try {
		testGitCatalogUtils.removeGit();
	} catch (e) {
		console.warn(`${label}: removeGit failed:`, e);
	}
}

let jest: Subprocess | null = null;
let cleaning = false;

async function cleanup(): Promise<void> {
	if (cleaning) return;
	cleaning = true;
	if (jest && jest.exitCode === null) {
		jest.kill("SIGTERM");
		await Promise.race([jest.exited, Bun.sleep(2000)]);
		if (jest.exitCode === null) jest.kill("SIGKILL");
	}
	if (useServer) await resetFixtures("cleanup");
}

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
	process.on(sig, () => void cleanup().then(() => process.exit(130)));
}

let exitCode = 1;
try {
	if (useServer) {
		await resetFixtures("preflight");
		await spawn([MOCK_SERVER_BIN, "start"], { cwd: FIXTURES_PATH, stdout: "inherit", stderr: "inherit" }).exited;
		testGitCatalogUtils.initGit();
	}

	jest = spawn(jestCommand(jestArgs), {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		env: process.env,
	});
	exitCode = await jest.exited;
} catch (e) {
	console.error(e);
} finally {
	await cleanup();
}

process.exit(exitCode);
