import resolveBackendModule from "@app/resolveModule/backend";
import { type CommandTree, createCommands } from "../commands";
import type Application from "../types/Application";

const container = window as {
	commands?: CommandTree;
};

const getCommands = (app: Application): CommandTree => {
	resolveBackendModule("getDOMParser");
	if (container.commands) return container.commands;
	container.commands = createCommands(app);
	return container.commands;
};

export default getCommands;
