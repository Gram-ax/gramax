import { type CommandTree, createCommands } from "@app/commands";
import type Application from "@app/types/Application";

const getCommands = (app: Application): CommandTree => {
	if (global.commands) return global.commands;
	global.commands = createCommands(app);
	return global.commands;
};

export default getCommands;
