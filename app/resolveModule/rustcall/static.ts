/** biome-ignore-all lint/suspicious/noExplicitAny: command args vary */
import Path from "@core/FileProvider/Path/Path";
import ZipFileProvider from "@ext/static/logic/ZipFileProvider";
import PathUtils from "path";
import { getBaseCatalogName } from "../../../apps/gramax-cli/src/logic/initialDataUtils/getCatalogName";
import {
	type DirectoryInfoBasic,
	type ExtendedWindow,
	type FileInfoBasic,
	InitialDataKeys,
} from "../../../apps/gramax-cli/src/logic/initialDataUtils/types";
import { parseCommand } from "./index";

const directory: DirectoryInfoBasic = (window as ExtendedWindow)[InitialDataKeys.DIRECTORY] || {
	name: "docs",
	type: "dir",
	children: [],
};

const catalogName = getBaseCatalogName();

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
	read_dir: ({ path }) => {
		const dir = findItemByPath(path);
		if (dir?.type === "dir") return (dir as DirectoryInfoBasic).children.map((c) => c.name);
		throw new Error(`Directory not found or is a file: ${path}`);
	},
	read_file: async ({ path }: { path: string }) => {
		const file = findItemByPath(path);
		if (file?.type === "file") {
			const articleFiles = await promisedArticleFiles;
			const slicedPath = new Path(path.startsWith("/") ? path.slice(1) : path);
			if (await articleFiles.exists(slicedPath)) return articleFiles.readAsBinary(slicedPath);
			return await fetchFile(path);
		}
		throw new Error(`File not found or is a directory: ${path}`);
	},
	read_link: () => {
		throw new Error("Not implemented");
	},
	getstat: ({ path }) => {
		const item = findItemByPath(path);
		return { type: item.type };
	},
	rmfile: () => {
		throw new Error("Not implemented");
	},
	exists: ({ path }) => {
		const item = findItemByPath(path);
		return !!item;
	},
	write_file: ({ path, content }) => {
		const segments = path.split("/").filter(Boolean);
		const fileName = segments.pop();
		const dirPath = segments.join("/");
		const dir = findItemByPath(dirPath);
		if (!dir || dir.type !== "dir") throw new Error(`Directory not found: ${dirPath}`);
		const existing = (dir as DirectoryInfoBasic).children.find((c) => c.name === fileName);
		if (existing && "content" in existing) existing.content = content;
	},
	read_dir_stats: ({ path }) => {
		const dir = findItemByPath(path);
		if (dir?.type !== "dir") throw new Error(`Directory not found or is a file: ${path}`);
		return (dir as DirectoryInfoBasic).children.map((c) => ({
			name: c.name,
			type: c.type,
			size: 0,
			ctimeMs: 0,
			mtimeMs: 0,
		}));
	},
	make_dir: ({ path }) => {
		const segments = path.split("/").filter(Boolean);
		let current = directory;
		for (const segment of segments) {
			let next = current.children.find((c) => c.name === segment && "children" in c);
			if (!next) {
				next = { name: segment, type: "dir", children: [] };
				current.children.push(next);
			} else {
				throw new Error(`Directory not found: ${segment}`);
			}
			current = next as DirectoryInfoBasic;
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
