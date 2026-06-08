import * as fs from "fs/promises";
import * as path from "path";
import { parseCommand } from "./index";

type DiskScope = { kind: "disk"; root: string };

const decorate = (kind: "file" | "dir" | "symbolic", size: number, ctimeMs: number, mtimeMs: number) => ({
	type: kind,
	size,
	ctimeMs,
	mtimeMs,
});

const toStat = async (p: string, followLink: boolean) => {
	const s = followLink ? await fs.stat(p) : await fs.lstat(p);
	const kind = s.isDirectory() ? "dir" : s.isSymbolicLink() ? "symbolic" : "file";
	return decorate(kind, Number(s.size), Number(s.ctimeMs), Number(s.mtimeMs));
};

const resolveDisk = (scope: unknown, rel: string): string => {
	const s = scope as DiskScope | undefined;
	if (!s || s.kind !== "disk") throw new Error(`fs cli call: unsupported scope ${JSON.stringify(scope)}`);
	const root = s.root || "";
	if (!rel) return root;
	if (path.isAbsolute(rel)) return rel;
	if (!root) return rel;
	return path.join(root, rel);
};

// biome-ignore lint/suspicious/noExplicitAny: handler arg shapes vary
const fsHandlers: Record<string, (args: any) => Promise<any>> = {
	exists: async ({ scope, path: p }) => {
		try {
			await fs.access(resolveDisk(scope, p));
			return true;
		} catch {
			return false;
		}
	},
	getstat: ({ scope, path: p, followLink }) => toStat(resolveDisk(scope, p), !!followLink),
	read_dir: async ({ scope, path: p }) => fs.readdir(resolveDisk(scope, p)),
	read_dir_stats: async ({ scope, path: p }) => {
		const abs = resolveDisk(scope, p);
		const entries = await fs.readdir(abs);
		return Promise.all(
			entries.map(async (name) => ({
				name,
				...(await toStat(path.join(abs, name), false)),
			})),
		);
	},
	read_link: ({ scope, path: p }) => fs.readlink(resolveDisk(scope, p)),
	read_file: async ({ scope, path: p }) => {
		const buf = await fs.readFile(resolveDisk(scope, p));
		return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
	},
	write_file: async ({ scope, path: p, content }) => {
		const abs = resolveDisk(scope, p);
		await fs.mkdir(path.dirname(abs), { recursive: true });
		await fs.writeFile(abs, content);
	},
	make_dir: ({ scope, path: p, recursive }) => fs.mkdir(resolveDisk(scope, p), { recursive: !!recursive }),
	remove_dir: ({ scope, path: p, recursive }) =>
		fs.rm(resolveDisk(scope, p), { recursive: !!recursive, force: false }),
	rmfile: ({ scope, path: p }) => fs.unlink(resolveDisk(scope, p)),
	hardlink: ({ scope, from, to }) => fs.symlink(resolveDisk(scope, from), resolveDisk(scope, to)),
	copy: async ({ scope, from, to }) => {
		const absFrom = resolveDisk(scope, from);
		const absTo = resolveDisk(scope, to);
		const stat = await fs.lstat(absFrom);
		if (stat.isDirectory()) await fs.cp(absFrom, absTo, { recursive: true });
		else await fs.copyFile(absFrom, absTo);
	},
	mv: async ({ scope, from, to }) => {
		const absFrom = resolveDisk(scope, from);
		const absTo = resolveDisk(scope, to);
		await fs.mkdir(path.dirname(absTo), { recursive: true });
		await fs.rename(absFrom, absTo);
	},
	delete_empty_dirs: async ({ scope, path: p }) => {
		const walk = async (dir: string) => {
			let entries: string[];
			try {
				entries = await fs.readdir(dir);
			} catch {
				return;
			}
			for (const name of entries) {
				if (name === ".git") continue;
				const child = path.join(dir, name);
				const st = await fs.lstat(child);
				if (st.isDirectory()) await walk(child);
			}
			try {
				const remaining = await fs.readdir(dir);
				if (remaining.length === 0) await fs.rmdir(dir);
			} catch {}
		};
		await walk(resolveDisk(scope, p));
	},
};

// biome-ignore lint/suspicious/noExplicitAny: args vary
export const cliCall = async <O>(command: string, args: Record<string, unknown> = {} as any): Promise<O> => {
	const [namespace, cmd] = parseCommand(command);
	if (namespace === "git") {
		if (cmd === "is_init") return false as O;
		throw new Error("git call not supported in cli environment");
	}
	const handler = fsHandlers[cmd];
	if (!handler) throw new Error(`fs cli call: unknown command ${cmd}`);
	return (await handler(args)) as O;
};
