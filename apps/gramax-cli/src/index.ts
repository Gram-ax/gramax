#!/usr/bin/env -S node --no-warnings

import { WORKSPACE_CONFIG_FILENAME } from "@app/config/const";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import { Command } from "commander";
import fs from "fs-extra";
import { basename } from "path";
import CliUserError from "./logic/CliUserError";
import { generateBuildCommand } from "./logic/cli/build/command";
import { generateCheckCommand } from "./logic/cli/check/command";
import { generateExportCommand } from "./logic/cli/export/command";
import { generateImportYandexCommand } from "./logic/cli/import/command";
import { STEP_ERROR_NAME } from "./logic/cli/utils/logger";
import ChalkLogger from "./utils/ChalkLogger";

type WriteFileFn = typeof fs.writeFile;

const program = new Command();

program.helpOption("-h, --help", "Display help for the command line tool");
program.helpCommand("help [command]", "Display help for a specific command");

generateBuildCommand(program);
generateCheckCommand(program);
generateExportCommand(program);
generateImportYandexCommand(program);

const origWrite = process.stderr.write.bind(process.stderr) as typeof process.stderr.write;
const uiKitError = "forwardRef render functions accept exactly two parameters";

const filterUiKitError = ((...args: Parameters<typeof origWrite>): ReturnType<typeof origWrite> => {
	const [str] = args;
	if (typeof str === "string" && str.includes(uiKitError)) return true;
	return origWrite(...args);
}) as typeof process.stderr.write;

process.stderr.write = filterUiKitError;

const startCli = async () => {
	const originalWriteFile = fs.writeFile;
	Object.defineProperty(fs, "writeFile", {
		writable: true,
		value: (...args: Parameters<WriteFileFn>) => {
			if (typeof args[0] === "string" && basename(args[0]) !== WORKSPACE_CONFIG_FILENAME)
				originalWriteFile.apply(fs, args);
		},
	});
	const { default: packageInfo } = await import("./package.json", { with: { type: "json" } });
	const { name, description, version } = packageInfo;
	program.name(name).description(description).version(version);

	try {
		ChalkLogger.log();
		await program.parseAsync(process.argv);
	} catch (error) {
		ChalkLogger.setSilent(false);
		if (error instanceof Error) {
			const logErrorMessage = (text: string) => {
				ChalkLogger.log(text, {
					indent: error.name === STEP_ERROR_NAME ? 1 : 0,
					styles: ["red", "bold"],
				});
			};

			if ((error as CliUserError).type === ErrorType.CliUser) {
				logErrorMessage(error.message);
			} else {
				if (typeof error.cause === "string") logErrorMessage(error.cause);

				ChalkLogger.log();
				ChalkLogger.log(error.stack, { styles: ["red"] });
			}
		} else {
			ChalkLogger.log(`An unexpected error occurred: ${error}`, { styles: ["red", "bold"] });
		}
		ChalkLogger.log();
		process.exit(1);
	} finally {
		ChalkLogger.log();
	}
};

void startCli();
