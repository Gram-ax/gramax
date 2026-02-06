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

const directory: DirectoryInfoBasic = (window as ExtendedWindow)[InitialDataKeys.DIRECTORY] || {
	name: "docs",
	type: "dir",
	children: [],
};

// biome-ignore lint/suspicious/noExplicitAny: args is any
export const StaticCall = async <O>(command: string, args?: any): Promise<O> => {
	return await commands[command](args);
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

const commands = {
	read_dir: ({ path }) => {
		const dir = findItemByPath(path);

		if (dir?.type === "dir") {
			return (dir as DirectoryInfoBasic).children.map((child) => child.name);
		}
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

		if (!dir || dir.type !== "dir") {
			throw new Error(`Directory not found: ${dirPath}`);
		}

		const existingFile = (dir as DirectoryInfoBasic).children.find((child) => child.name === fileName);
		if (existingFile && "content" in existingFile) {
			existingFile.content = content;
		}
	},
	make_dir: ({ path }) => {
		const segments = path.split("/").filter(Boolean);
		let current = directory;

		for (const segment of segments) {
			let next = current.children.find((child) => child.name === segment && "children" in child);
			if (!next) {
				next = { name: segment, type: "dir", children: [] };
				current.children.push(next);
			} else {
				throw new Error(`Directory not found: ${segment}`);
			}
			current = next;
		}
	},
};

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
