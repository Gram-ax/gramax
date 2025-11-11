import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { env } from "@app/resolveModule/env";
import Path from "@core/FileProvider/Path/Path";
import { downloadZipArchive } from "@core/FileProvider/utils/createZipArchive";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BrowserStashCache from "@ext/git/core/BrowserStashCache/BrowserStashCache";
import * as git from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitStash from "@ext/git/core/model/GitStash";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import { LogLevel } from "@ext/loggers/Logger";
import PersistentLogger from "@ext/loggers/PersistentLogger";

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
	return await git.status({ repoPath, index: false });
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

export const clearLockFiles = async (catalogName: string) => {
	const app = await getApp();
	const fp = app.wm.current().getFileProvider();
	const remotesPath = new Path([catalogName, ".git/refs/remotes/origin"]);
	const gxLock = new Path([catalogName, ".git/.gx-lock"]);

	const deleteLocks = async (path: Path) => {
		const items = await fp.readdir(path);
		for (const item of items) {
			const itemPath = path.join(new Path(item));
			if (await fp.isFolder(itemPath)) {
				await deleteLocks(itemPath);
			} else {
				if (item.endsWith(".lock")) {
					await fp.delete(itemPath);
				}
			}
		}
	};

	if (await fp.exists(gxLock)) await fp.delete(gxLock);
	await deleteLocks(remotesPath);
};

export const clearGxLock = async () => {
	const app = await getApp();
	const fp = app.wm.current().getFileProvider();
	let i = 0;

	for (const [name] of app.wm.current().getAllCatalogs()) {
		const gxLock = new Path([name, ".git/.gx-lock"]);
		if (await fp.exists(gxLock)) {
			await fp.delete(gxLock);
			i++;
		}
	}
	console.log(`deleted ${i} gx-lock files`);
};

export const gitAddAll = async (catalogName: string) => {
	const app = await getApp();
	const { gvc } = (await app.wm.current().getContextlessCatalog(catalogName)).repo;
	await gvc?.add();
};

export const gitStashes = (catalogName?: string) => {
	return catalogName ? BrowserStashCache.getStashCache(catalogName) : BrowserStashCache.getAllStashCaches();
};

export const gitApplyStash = async (catalogName: string, stashOid: string) => {
	const app = await getApp();
	const { gvc } = (await app.wm.current().getContextlessCatalog(catalogName)).repo;
	await gvc?.applyStash(new GitStash(stashOid));
};

export const zip = async (catalog: string) => {
	const app = await getApp();
	const fp = app.wm.current().getFileProvider();
	await downloadZipArchive(fp, new Path(catalog), catalog);
};
