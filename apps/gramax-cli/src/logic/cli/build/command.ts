import camelToKebabCase from "@core-ui/camelToKebabCase";
import { Command, Option } from "commander";
import { join } from "path";
import ChalkLogger from "../../../utils/ChalkLogger";

export interface BuildOptions {
	source: string;
	destination: string;
	SkipCheck: boolean;
	forceUiLangSync: boolean;
}

export interface OptionProps {
	description: string;
	defaultValue?: { value: unknown; description?: string };
	short?: string;
	type?: string;
}

const buildOptions: { [K in keyof BuildOptions]: OptionProps } = {
	source: {
		description: "Path to the source directory created using the Gramax editor",
		defaultValue: {
			value: process.cwd(),
			description: "current directory",
		},
		short: "s",
		type: "path",
	},
	destination: {
		description: "Path where the generated static site will be saved",
		defaultValue: {
			value: join(process.cwd(), "/build"),
			description: "./build",
		},
		short: "d",
		type: "path",
	},
	SkipCheck: {
		description: "Skip the check process",
		defaultValue: {
			value: false,
			description: "false",
		},
	},
	forceUiLangSync: {
		description: "Use UI language same as content language if available",
		defaultValue: {
			value: false,
			description: "false",
		},
		short: "l",
	},
};

export const generateBuildCommand = (program: Command) => {
	const buildCommand = program
		.command("build")
		.description("Build a static site from the specified source directory")
		.helpOption("-h, --help", "Display help for the build command")
		.addHelpText(
			"afterAll",
			`
	Example:
	  gramax-cli build -s ./my-site -d ./build`,
		)
		.action(async (options) => {
			const startTime = Date.now();
			const { default: buildCommandFunction } = await import(".");
			await buildCommandFunction(options);
			const endTime = Date.now();
			const duration = ((endTime - startTime) / 1000).toFixed(2);
			ChalkLogger.log();
			ChalkLogger.log(`Build completed successfully in ${duration}s`, { prefix: "SUCCESS" });
		});

	addOptionsToCommand(buildCommand, buildOptions);
};

export const addOptionsToCommand = <T>(command: Command, options: { [K in keyof T]: OptionProps }): void => {
	for (const key in options) {
		const { description, defaultValue, short, type } = options[key as keyof T];
		const flag = `${short ? `-${short}, ` : ""}--${camelToKebabCase(key)} ${type ? `<${type}>` : ""}`;
		const option = new Option(flag, description);
		defaultValue && option.default(defaultValue.value, defaultValue.description);
		command.addOption(option);
	}
};
