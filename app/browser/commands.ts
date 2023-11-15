import { CommandTree, createCommands } from "../commands";
import Application from "../types/Application";

const container = window as {
	commands?: CommandTree;
};

const getCommands = (app: Application): CommandTree => {
	if (container.commands) return container.commands;
	container.commands = createCommands(app);
	return container.commands;
};

export default getCommands;
