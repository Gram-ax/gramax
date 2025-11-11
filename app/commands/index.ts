import enterprise from "@app/commands/enterprise";
import inbox from "@app/commands/inbox";
import setLanguage from "@app/commands/language/set";
import pdf from "@app/commands/pdf";
import workspace from "@app/commands/workspace";
import Application from "../types/Application";
import { Command } from "../types/Command";
import article from "./article";
import catalog from "./catalog";
import debug from "./debug";
import download from "./download";
import elements from "./elements";
import healthcheck from "./healthcheck";
import item from "./item";
import mergeRequests from "./mergeRequests";
import page from "./pageData";
import search from "./search";
import storage from "./storage";
import setTheme from "./theme/setTheme";
import versionControl from "./versionControl";
import word from "./word";
import templates from "@app/commands/templates";
import ai from "@app/commands/ai";
import quiz from "./quiz";

const commands = {
	ai,
	enterprise,
	setTheme,
	setLanguage,
	article,
	catalog,
	elements,
	healthcheck,
	download,
	item,
	page,
	storage,
	versionControl,
	mergeRequests,
	word,
	pdf,
	debug,
	search,
	workspace,
	inbox,
	templates,
	quiz,
};

type CommandTree = typeof commands;

const assign = (object: object, app: Application, deep?: number) => {
	if (!object || typeof object !== "object") return;
	if ("_app" in object) return assignCommand(object as any, app, commands);

	if (deep > 10) throw new Error("Commands structure are invalid");
	Object.values(object).forEach((x) => assign(x, app, ++deep));
};

const assignCommand = (command: Command<any, any>, app: Application, commandTree: CommandTree) => {
	command["_app"] = app;
	command["_commands"] = commandTree;
	return;
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

export { assignCommand, createCommands, findCommand };
export type { CommandTree };
