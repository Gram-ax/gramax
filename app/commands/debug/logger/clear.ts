import StorageLogger from "@ext/loggers/StorageLogger";
import { Command } from "../../../types/Command";

const clearLogger: Command<void, void> = Command.create({
	do() {
		return StorageLogger.clearLogs();
	},
});

export default clearLogger;
