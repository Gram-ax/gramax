import StorageLogger from "@ext/loggers/StorageLogger";
import { Command } from "../../../types/Command";

const getLogger: Command<void, string[]> = Command.create({
	do() {
		return StorageLogger.getLogs();
	},
});

export default getLogger;
