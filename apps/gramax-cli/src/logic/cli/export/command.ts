import { Command } from "commander";
import { exportCommandFunction } from ".";
import { addOptionsToCommand, OptionProps } from "../build/command";
import { join } from "path";
import { ExportFormat } from "@ext/wordExport/components/ItemExport";

export interface ExportOptions {
	source: string;
	output: string;
	yes: boolean;
	format: ExportFormat;
	template: string;
}

export const defaultName = "export";

const exportOptions: {
	[K in keyof ExportOptions]: OptionProps;
} = {
	source: {
		description: "Path to the catalog directory for export",
		defaultValue: {
			value: process.cwd(),
			description: "current directory",
		},
		short: "s",
		type: "path",
	},
	output: {
		description: "Path where the generated file will be saved",
		defaultValue: {
			value: join(process.cwd(), defaultName),
			description: defaultName,
		},
		short: "o",
		type: "path",
	},
	yes: {
		description: "Skip confirmation",
		short: "y",
	},
	format: {
		description: "Export format: docx or pdf",
		defaultValue: {
			value: "docx",
			description: "docx",
		},
		short: "f",
		type: "string",
	},
	template: {
		description:
			"Path to a template file, or template name from the workspace of the catalog.\n" +
			"Applies only when format is 'docx'",
		short: "t",
		type: "string",
	},
};

export const generateExportCommand = (program: Command) => {
	const exportCommand = program
		.command("export")
		.description("Export the specified catalog directory to the specified format")
		.helpOption("-h, --help", "Display help for the export command")
		.action(async (options) => {
			await exportCommandFunction(options);
		});

	addOptionsToCommand(exportCommand, exportOptions);
};
