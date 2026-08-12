/** biome-ignore-all lint/suspicious/noExplicitAny: command args vary */
import Path from "@core/FileProvider/Path/Path";
import ZipFileProvider from "@ext/static/logic/ZipFileProvider";
import PathUtils from "path";
import { getBaseCatalogName } from "../../../apps/cli/src/logic/initialDataUtils/getCatalogName";
import {
	type DirectoryInfoBasic,
	type ExtendedWindow,
	type FileInfoBasic,
	InitialDataKeys,
} from "../../../apps/cli/src/logic/initialDataUtils/types";
import { parseCommand } from "./index";

type DiskScope = { kind: "disk"; root: string };

const directory: DirectoryInfoBasic = (window as ExtendedWindow)[InitialDataKeys.DIRECTORY] || {
	name: "docs",
	type: "dir",
	children: [],
};

const catalogName = getBaseCatalogName();

const resolveDisk = (scope: unknown, rel: string): string => {
	const s = scope as DiskScope | undefined;
	if (s?.kind !== "disk") throw new Error(`static fs call: unsupported scope ${JSON.stringify(scope)}`);
	const root = s.root || "";
	if (!rel) return root;
	if (PathUtils.isAbsolute(rel)) return rel;
	if (!root) return rel;
	return PathUtils.join(root, rel);
};

const fetchFile = async (path: string) => {
	const importPath = new URL(PathUtils.join(document.baseURI, path)).href;
	return Buffer.from(await (await fetch(importPath)).arrayBuffer());
};

const zfp = ZipFileProvider.create();
const promisedArticleFiles = (async () => {
	const zipFilename = (window as ExtendedWindow)[InitialDataKeys.ZIP_FILENAME] || ".zip";
	const zipFetch = await fetchFile(PathUtils.join(catalogName, zipFilename));
	const fp = await zfp;
	await fp.zip.loadAsync(new Uint8Array(zipFetch));
	return fp;
})();

const findItemByPath = (path: string): FileInfoBasic | DirectoryInfoBasic => {
	const segments = path.split("/").filter(Boolean);
	let current: FileInfoBasic | DirectoryInfoBasic = directory;

	for (const segment of segments) {
		const next = (current as DirectoryInfoBasic).children?.find((child) => child.name === segment);
		if (!next) return null;
		current = next;
	}
	return current;
};

const fsCommands: Record<string, (args: any) => any> = {
	read_dir: ({ scope, path }) => {
		const abs = resolveDisk(scope, path);
		const dir = findItemByPath(abs);
		if (dir?.type === "dir") return (dir as DirectoryInfoBasic).children.map((c) => c.name);
		throw new Error(`Directory not found or is a file: ${abs}`);
	},
	read_file: async ({ scope, path }: { scope: unknown; path: string }) => {
		const abs = resolveDisk(scope, path);
		const file = findItemByPath(abs);
		if (file?.type === "file") {
			const articleFiles = await promisedArticleFiles;
			const slicedPath = new Path(abs.startsWith("/") ? abs.slice(1) : abs);
			if (await articleFiles.exists(slicedPath)) return articleFiles.readAsBinary(slicedPath);
			return await fetchFile(abs);
		}
		throw new Error(`File not found or is a directory: ${abs}`);
	},
	read_link: () => {
		throw new Error("Not implemented");
	},
	getstat: ({ scope, path }) => {
		const abs = resolveDisk(scope, path);
		const item = findItemByPath(abs);
		if (!item) throw new Error(`Path not found: ${abs}`);
		return { type: item.type };
	},
	rmfile: () => {
		throw new Error("Not implemented");
	},
	exists: ({ scope, path }) => {
		const item = findItemByPath(resolveDisk(scope, path));
		return !!item;
	},
	write_file: ({ scope, path, content }) => {
		const abs = resolveDisk(scope, path);
		const segments = abs.split("/").filter(Boolean);
		const fileName = segments.pop();
		const dirPath = segments.join("/");
		const dir = findItemByPath(dirPath);
		if (dir?.type !== "dir") throw new Error(`Directory not found: ${dirPath}`);
		const existing = (dir as DirectoryInfoBasic).children.find((c) => c.name === fileName);
		if (existing && "content" in existing) existing.content = content;
	},
	read_dir_stats: ({ scope, path }) => {
		const abs = resolveDisk(scope, path);
		const dir = findItemByPath(abs);
		if (dir?.type !== "dir") throw new Error(`Directory not found or is a file: ${abs}`);
		return (dir as DirectoryInfoBasic).children.map((c) => ({
			name: c.name,
			type: c.type,
			size: 0,
			ctimeMs: 0,
			mtimeMs: 0,
		}));
	},
	make_dir: ({ scope, path }) => {
		const segments = resolveDisk(scope, path).split("/").filter(Boolean);
		let current = directory;
		for (const segment of segments) {
			const existing = current.children.find((c) => c.name === segment);
			if (existing) {
				if (existing.type !== "dir") throw new Error(`Path exists and is not a directory: ${segment}`);
				current = existing as DirectoryInfoBasic;
				continue;
			}
			const next: DirectoryInfoBasic = { name: segment, type: "dir", children: [] };
			current.children.push(next);
			current = next;
		}
	},
};

export const staticCall = async <O>(command: string, args?: any): Promise<O> => {
	const [namespace, cmd] = parseCommand(command);
	if (namespace === "git") {
		if (cmd === "is_init") return false as O;
		throw new Error("git call not supported in static environment");
	}
	const handler = fsCommands[cmd];
	if (!handler) throw new Error(`static fs call: unknown command ${cmd}`);
	return (await handler(args)) as O;
};
