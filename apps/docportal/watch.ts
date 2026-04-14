import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DEBOUNCE_MS = 300;
const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, "../..");

const watchDirs = [
	path.join(dirname, "server"),
	path.join(dirname, "client"),
	path.join(rootDir, "app"),
	path.join(rootDir, "core"),
];

let buildTimeout: ReturnType<typeof setTimeout> = null;
let serverProcess: ReturnType<typeof Bun.spawn> = null;

async function runBuild() {
	console.log("\n[watch] Rebuilding...");
	const serverResult = await Bun.spawn(["bun", "./build/server.ts"], {
		cwd: dirname,
		env: { ...process.env, VITE_ENVIRONMENT: "docportal" },
		stdout: "inherit",
		stderr: "inherit",
	}).exited;

	const clientResult = await Bun.spawn(["bun", "./build/client.ts"], {
		cwd: dirname,
		env: { ...process.env, VITE_ENVIRONMENT: "docportal" },
		stdout: "inherit",
		stderr: "inherit",
	}).exited;

	if (serverResult === 0 && clientResult === 0) {
		console.log("[watch] Build complete");
		restartServer();
	} else {
		console.error("[watch] Build failed");
	}
}

function startServer() {
	serverProcess = Bun.spawn(["bun", "run", "./dist/index.js"], {
		cwd: dirname,
		env: { ...process.env, VITE_ENVIRONMENT: "docportal" },
		stdout: "inherit",
		stderr: "inherit",
	});
}

function restartServer() {
	if (serverProcess) {
		serverProcess.kill();
		serverProcess = null;
	}
	startServer();
}

function scheduleBuild() {
	if (buildTimeout) clearTimeout(buildTimeout);
	buildTimeout = setTimeout(() => {
		buildTimeout = null;
		void runBuild();
	}, DEBOUNCE_MS);
}

function watchRecursive(dir: string) {
	if (!fs.existsSync(dir)) return;

	fs.watch(dir, { recursive: true }, (_, filename) => {
		if (!filename) return;
		if (/\.(ts|tsx|js|jsx|css|json)$/.test(filename)) {
			scheduleBuild();
		}
	});

	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (
				entry.isDirectory() &&
				!entry.name.startsWith(".") &&
				entry.name !== "node_modules" &&
				entry.name !== "dist"
			) {
				watchRecursive(path.join(dir, entry.name));
			}
		}
	} catch {}
}

process.env.VITE_ENVIRONMENT = "docportal";
console.log("[watch] Initial build...");
await runBuild();
console.log("[watch] Watching for changes...");
for (const dir of watchDirs) {
	watchRecursive(dir);
}
