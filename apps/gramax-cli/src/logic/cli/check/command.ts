import { Command } from "commander";
import { addOptionsToCommand, OptionProps } from "../build/command";

export interface CheckOptions {
	destination: string;
	output: string;
}

export const defaultCheckName = "check.log";

const checkOptions: {
	[K in keyof CheckOptions]: OptionProps;
} = {
	destination: {
		description: "Path to the catalog directory for validation",
		defaultValue: {
			value: process.cwd(),
			description: "current directory",
		},
		short: "d",
		type: "path",
	},
	output: {
		description: "Path where the validation log file will be saved",
		short: "o",
		type: "path",
	},
};

export const generateCheckCommand = (program: Command) => {
	const checkCommand = program
		.command("check")
		.description("Check the specified catalog directory for errors")
		.helpOption("-h, --help", "Display help for the check command")
		.action(async (options) => {
			const { checkCommandFunction } = await import(".");
			await checkCommandFunction(options);
		});

	addOptionsToCommand(checkCommand, checkOptions);
};
