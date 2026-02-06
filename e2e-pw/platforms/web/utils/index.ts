import type Application from "@gramax/app/types/Application";
import type { Page as PlaywrightPage } from "@playwright/test";
import fs from "fs/promises";
import type JsZip from "jszip";
import { resolve } from "path";

declare global {
	interface Window {
		app?: Promise<Application>;
		debug?: typeof import("@gramax/apps/browser/src/debug");
	}
}

export type FileTree = {
	[key: string]: FileTree | string | number[];
};

export const createFileTree = async (page: PlaywrightPage, tree: FileTree, basePath: string = ""): Promise<void> => {
	await page.evaluate(
		async ({ tree, basePath }: { tree: FileTree; basePath: string }) => {
			const intoPath = window.debug.intoPath;

			const { wm } = await window.app!;
			const fp = wm.current().getFileProvider();

			const processNode = async (node: FileTree | string | number[], currentPath: string) => {
				if (typeof node === "string") {
					const path = intoPath(currentPath);
					const encoder = new TextEncoder();
					await fp.write(path, encoder.encode(node) as Buffer);
					return;
				}

				if (Array.isArray(node)) {
					const path = intoPath(currentPath);
					await fp.write(path, new Uint8Array(node) as Buffer);
					return;
				}

				if (typeof node === "object" && node !== null) {
					const path = intoPath(currentPath);
					await fp.mkdir(path).catch(() => {});

					for (const [name, value] of Object.entries(node)) {
						const nextPath = currentPath ? `${currentPath}/${name}` : name;
						await processNode(value, nextPath);
					}
					return;
				}

				throw new Error(`Invalid node type at path: ${currentPath}`);
			};

			await processNode(tree, basePath);
		},
		{ tree, basePath },
	);
};

export const uploadAndExtractZip = async (page: PlaywrightPage, zip: string): Promise<void> => {
	const absoluteZipPath = resolve(process.cwd(), "zips", zip);
	const zipBuffer = await fs.readFile(absoluteZipPath);
	const zipData = new Uint8Array(zipBuffer);

	await page.evaluate(async (zipData: Uint8Array) => {
		const intoPath = window.debug.intoPath;

		const { wm } = await window.app!;
		const fp = wm.current().getFileProvider();

		const zip = await window.debug.initZip();
		await zip.loadAsync(zipData);

		for (const [relativePath, entry] of Object.entries(zip.files as Record<string, JsZip.JSZipObject>)) {
			if (entry.dir || relativePath.endsWith("/")) {
				const path = intoPath(relativePath.replace(/\/$/, ""));
				await fp.mkdir(path).catch(() => {});
			} else {
				const content = await entry.async("uint8array");
				const path = intoPath(relativePath);
				await fp.write(path, new Uint8Array(content) as Buffer);
			}
		}
	}, zipData);
};

export type SourceData = Parameters<typeof import("@gramax/apps/browser/src/debug").setSourceData>[0];

export const setStorage = async (page: PlaywrightPage, sourceData: SourceData): Promise<void> => {
	await page.evaluate(async (sourceData) => {
		await window.debug.setSourceData(sourceData);
	}, sourceData);
};

export const readDirToFileTree = async (dirPath: string | URL): Promise<FileTree> => {
	const textExtensions = new Set([
		".md",
		".txt",
		".json",
		".xml",
		".html",
		".yml",
		".yaml",
		".svg",
		".csv",
		".log",
		".sh",
		".bat",
		".gitignore",
		".toml",
	]);

	const isBinaryFile = async (filePath: string | URL): Promise<boolean> => {
		const ext =
			filePath instanceof URL
				? filePath.pathname.split(".").pop()
				: filePath.substring(filePath.lastIndexOf(".")).toLowerCase();

		if (ext && textExtensions.has(ext)) {
			return false;
		}

		try {
			const buffer = await fs.readFile(filePath);
			const sample = buffer.subarray(0, 8192);

			for (let i = 0; i < sample.length; i++) {
				if (sample[i] === 0) {
					return true;
				}
			}
			return false;
		} catch {
			return true;
		}
	};

	const readDir = async (path: string | URL): Promise<FileTree> => {
		const tree: FileTree = {};
		const entries = await fs.readdir(path, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = resolve(entry.parentPath, entry.name);

			if (entry.isDirectory()) {
				tree[entry.name] = await readDir(fullPath);
			} else if (entry.isFile()) {
				const isBinary = await isBinaryFile(fullPath);

				if (!isBinary) {
					const content = await fs.readFile(fullPath, "utf-8");
					tree[entry.name] = content;
				}
			}
		}

		return tree;
	};

	return await readDir(dirPath);
};
