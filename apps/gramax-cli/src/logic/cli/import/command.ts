import { Command } from "commander";
import { addOptionsToCommand, OptionProps } from "../build/command";
import { importYandexCommandFunction } from "./index";

export interface ImportYandexOptions {
	raw: boolean;
	config: string;
	destination: string;
}

const importYandexOptions: { [K in keyof ImportYandexOptions]: OptionProps } = {
	raw: {
		description: "Disable markdown transformation",
		short: "r",
	},
	config: {
		description: "Path to config file",
		defaultValue: {
			value: process.cwd(),
			description: "gramax.config.yaml in current directory",
		},
		short: "c",
		type: "path",
	},
	destination: {
		description: "Path to destination directory",
		defaultValue: {
			value: process.cwd(),
			description: "imported folder in current directory",
		},
		short: "d",
		type: "path",
	},
};

export const generateImportYandexCommand = (program: Command) => {
	const importCommand = program.command("import").description("Import commands");

	const yandexCommand = importCommand
		.command("yandex-wiki")
		.description("Import data from Yandex wiki")
		.helpOption("-h, --help", "Display help for the yandex import command")
		.action(async (options) => {
			await importYandexCommandFunction(options);
		});

	addOptionsToCommand(yandexCommand, importYandexOptions);
};
