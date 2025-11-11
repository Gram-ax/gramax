import { $ } from "bun";
import fs from "fs/promises";
import { join } from "path";

export const env = (name: string, message = `required`): string => {
	const val = process.env[name];
	if (!val) {
		const error = new Error(`${name}: ${message}`);
		Error.captureStackTrace(error, env);
		throw error;
	}

	return val;
};

env.optional = (name: string) => {
	return process.env[name] || null;
};

env.exists = (name: string) => {
	return process.env[name] !== undefined;
};

export const setupEnvs = () => {
	process.env.LANGUAGE = "en_US";
	process.env.LANG = "en_US.UTF-8";
	process.env.LC_COLLATE = "C";
	process.env.LC_MESSAGES = "C";
	process.env.LC_MONETARY = "C";
	process.env.LC_NUMERIC = "C";
	process.env.LC_TIME = "C";
	process.env.LC_ALL = "";

	if (process.platform === "darwin") {
		process.env.LDFLAGS = "-L/opt/homebrew/opt/llvm/lib";
		process.env.CPPFLAGS = "-I/opt/homebrew/opt/llvm/include";
		process.env.PATH = "/opt/homebrew/opt/llvm/bin:$(pwd):" + process.env.PATH;
	}

	if (env.exists("NDK_HOME")) {
		process.env.PATH = `${env("NDK_HOME")}/toolchains/llvm/prebuilt/darwin-x86_64/bin:` + process.env.PATH;
	}
};

export const isCi = (() => {
	const ci = env.exists("CI");
	if (ci) console.error(`running in CI-mode`);
	return ci;
})();

export const project = (() => {
	const project = process.env.CI_PROJECT_DIR || process.cwd();
	if (project.endsWith("/")) return project.slice(0, -1);
	return project;
})();

export const buildDate = await (async () => {
	return await $`date "+%Y.%-m.%-d"`
		.quiet()
		.text()
		.then((text) => text.trim());
})();

export const commitCount = await (async () => {
	return await $`git rev-list --count --date=local --after="$(date +"%Y-%m-01T00:00:00")" HEAD`
		.quiet()
		.text()
		.then((text) => text.trim());
})();

export const artifactsDir = join(project, "apps-build-artifacts");

export const version = (postfix?: string) => {
	return `${buildDate}-${postfix ? `${postfix}.` : ""}${commitCount}`;
};

export const channel = () => {
	const branch = env.optional("BRANCH");
	if (branch === "master") return "prod";
	if (branch === "develop") return "dev";
	return "test";
};

export const sizeOf = async (path: string) => {
	const bytes = await sizeOf.bytes(path);

	if (bytes < 1024) return `${bytes}b`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}kb`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)}mb`;
	return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}gb`;
};

sizeOf.bytes = async (path: string) => {
	const stat = await fs.stat(path);
	let size = stat.size;

	if (stat.isDirectory()) {
		for (const file of await fs.readdir(path)) {
			size += await sizeOf.bytes(join(path, file));
		}
	}

	return size;
};
