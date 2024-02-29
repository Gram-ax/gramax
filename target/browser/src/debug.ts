import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { env } from "@app/resolveModule";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { downloadFile } from "@core-ui/downloadResource";
import Path from "@core/FileProvider/Path/Path";
import ConsoleLogger from "@ext/loggers/ConsoleLogger";
import { LogLevel } from "@ext/loggers/Logger";
import PersistentLogger from "@ext/loggers/PersistentLogger";

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

export const download = async (name: string) => {
	const JSZip = await import("jszip");
	const zip = new JSZip.default();
	const app = await getApp();
	const fp = app.lib.getFileProvider();
	const addFiles = async (path: Path) => {
		const dir = await fp.getItems(path);
		for (const file of dir) {
			file.isFile() ? zip.file(file.path.value, await fp.readAsBinary(file.path)) : await addFiles(file.path);
		}
	};
	await addFiles(intoPath(name));
	const content = await zip.generateAsync({ type: "blob" });
	downloadFile(content, MimeTypes.zip, name);
};

export const read = async (path: string) => {
	const app = await getApp();
	const fp = app.lib.getFileProvider();
	const content = await fp.read(new Path(path));
	console.log(content);
};

export const app = async () => await getApp();

export const commands = async () => getCommands(await app());

export const intoPath = (path: string) => new Path(path);

export { env };

export const logger = new ConsoleLogger();

export const logs = (filter?: RegExp, max = 9999) => {
	console.log(PersistentLogger.getLogs(filter, max));
};

export const clearLogs = PersistentLogger.clearLogs.bind(this);

logger.setLogLevel(LogLevel.error);
