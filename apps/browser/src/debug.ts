import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { env } from "@app/resolveModule/env";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { downloadFile } from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import * as git from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import { LogLevel } from "@ext/loggers/Logger";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import { Buffer } from "buffer";
import type { FsPromisesApi } from "memfs/lib/node/types/FsPromisesApi";

export const clear = async () => {
	console.log("Delete all");
	const app = await getApp();
	const fp = app.wm.current().getFileProvider();

	const items = await fp.getItems(Path.empty);
	await Promise.all(items.map((item) => fp.delete(item.path)));
	await fp.getItems(Path.empty);
};

export const items = async () => {
	const app = await getApp();
	const fp = app.wm.current().getFileProvider();

	let str = "Files of \n";
	const showFiles = async (path: Path, deep: number) => {
		const items = await fp.getItems(path);
		for (const item of items) {
			for (let i = 0; i < deep; i++) str += "\t";
			if (!item.isDirectory()) {
				const stats = await fp.getStat(item.path);
				str += `📄 ${item.name} ${stats.size}B\n`;
				continue;
			}
			str += `📂 ${item.name}\n`;
			await showFiles(item.path, deep + 1);
		}
	};

	await showFiles(Path.empty, 0);
	console.log(str);
};

export { RouterPathProvider };

export const download = async (name: string) => {
	const JSZip = await import("jszip");
	const FsaNodeFs = (await import("memfs/lib/fsa-to-node")).FsaNodeFs;
	const zip = new JSZip.default();
	const memFp: FsPromisesApi = new FsaNodeFs((await window.navigator.storage.getDirectory()) as any).promises;

	const app = await getApp();
	const fp = app.wm.current().getFileProvider();
	const addFiles = async (path: Path) => {
		const dir = await fp.getItems(path);
		for (const file of dir) {
			if (file.isFile()) {
				let fileBuffer: Buffer;
				try {
					fileBuffer = (await memFp.readFile(`docs/${file.path.value}`)) as Buffer;
				} catch (e) {
					console.error(e);
					fileBuffer = await fp.readAsBinary(file.path);
				}
				zip.file(file.path.value, fileBuffer);
			} else await addFiles(file.path);
		}
	};
	await addFiles(intoPath(name));
	const content = await zip.generateAsync({ type: "blob" });
	downloadFile(content, MimeTypes.zip, name);
};

export const app = async () => await getApp();

export const fs = {
	read: async (path: string) => {
		const app = await getApp();
		const fp = app.wm.current().getFileProvider();
		if ((await fp.getStat(new Path(path))).isDirectory()) {
			const items = await fp.getItems(new Path(path));
			items.forEach((i) => console.log(i.path.value));
		} else {
			const content = await fp.read(new Path(path));
			console.log(content);
		}
	},
	delete: async (path: string) => {
		const app = await getApp();
		const fp = app.wm.current().getFileProvider();
		await fp.delete(new Path(path));
	},
};

export const status = async (repoPath: string) => {
	return await git.status({ repoPath });
};

export const commands = async () => getCommands(await app());

export const intoPath = (path: string) => new Path(path);

export { env };

export const logger = new ConsoleLogger();

export const logs = (filter?: RegExp, max = 9999) => {
	console.log(PersistentLogger.getLogs(filter, max));
};

export const clearLogs = PersistentLogger.clearLogs.bind(this);

logger.setLogLevel(LogLevel.error);

const devModeItemName = "is_dev_mode";
export const devMode = {
	check: () => window.localStorage.getItem(devModeItemName) === "true",
	enable: () => window.localStorage.setItem(devModeItemName, "true"),
	disable: () => window.localStorage.setItem(devModeItemName, "false"),
};
