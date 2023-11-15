import Application from "../types/Application";
import { Command } from "../types/Command";
import article from "./article";
import catalog from "./catalog";
import comments from "./comments";
import debug from "./debug";
import diagram from "./diagram";
import download from "./download";
import healthcheck from "./healthcheck";
import html from "./html";
import item from "./item";
import page from "./pageData";
import search from "./search";
import storage from "./storage";
import setTheme from "./theme/setTheme";
import versionControl from "./versionControl";
import getVideoUrl from "./video/getVideoUrl";
import vscode from "./vscode";
import word from "./word";

const commands = {
	setTheme,
	article,
	catalog,
	diagram,
	comments,
	getVideoUrl,
	healthcheck,
	download,
	vscode,
	html,
	item,
	page,
	search,
	storage,
	versionControl,
	word,
	debug,
};

type CommandTree = typeof commands;

const assign = (object: object, app: Application, deep?: number) => {
	if (!object || typeof object !== "object") return;
	if ("_app" in object) {
		object["_app"] = app;
		object["_commands"] = commands;
		return;
	}

	if (deep > 10) throw new Error("Commands structure are invalid");
	Object.values(object).forEach((x) => assign(x, app, ++deep));
};

const findCommand = (commands: CommandTree, path: string): Command<unknown, any> => {
	const search = (object: any, deep = 0) => {
		if (!object || deep > 100) return;
		if (object._c?.path == path) return object;
		deep += 1;
		for (const [key, value] of Object.entries(object)) {
			if (["_c", "_app", "_commands"].includes(key)) return;
			const found = search(value as any, ++deep);
			if (found) return found;
		}
	};

	return search(commands);
};

const createCommands = (app: Application) => {
	assign(commands, app);
	return commands;
};

export { createCommands, findCommand };
export type { CommandTree };
