import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { env } from "@app/resolveModule";
import Path from "@core/FileProvider/Path/Path";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import { LogLevel } from "@ext/loggers/Logger";

export const clear = async () => {
	console.log("Delete all");
	const app = await getApp();
	const fp = app.lib.getFileProvider();

	const items = await fp.getItems(Path.empty);
	await Promise.all(items.map((item) => fp.delete(item.path)));
	await fp.getItems(Path.empty);
};

export const items = async () => {
	const app = await getApp();
	const fp = app.lib.getFileProvider();

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

export const read = async (path: string) => {
	const app = await getApp();
	const fp = app.lib.getFileProvider();
	const content = await fp.read(new Path(path));
	console.log(content);
};

export const app = async () => await getApp();

export const commands = async () => getCommands(await app());

export const path = (path: string) => new Path(path);

export const env1 = env;

export const logger = new ConsoleLogger();
logger.setLogLevel(LogLevel.error);
