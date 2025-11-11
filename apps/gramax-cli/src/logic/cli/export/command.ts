import { Command } from "commander";
import { addOptionsToCommand, OptionProps } from "../build/command";
import { join } from "path";
import type { ExportFormat } from "@ext/wordExport/components/ItemExport";
import ChalkLogger from "../../../utils/ChalkLogger";

export interface ExportOptions {
	source: string;
	output: string;
	yes: boolean;
	format: keyof typeof ExportFormat;
	template: string;
	PdfTitle: boolean;
	PdfToc: boolean;
	PdfNumber: boolean;
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
		description: "Export format: docx, pdf or beta-pdf",
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
			"Applies when format is 'docx' or beta-pdf",
		short: "t",
		type: "string",
	},
	PdfTitle: {
		description: "Add a title page (only for 'beta-pdf' format).",
	},
	PdfToc: {
		description: "Add a table of contents (only for 'beta-pdf' format).",
	},
	PdfNumber: {
		description: "Add heading numbering (only for 'beta-pdf' format).",
	},
};

export const generateExportCommand = (program: Command) => {
	const exportCommand = program
		.command("export")
		.description("Export the specified catalog directory to the specified format")
		.helpOption("-h, --help", "Display help for the export command")
		.action(async (options) => {
			const startTime = Date.now();
			const { exportCommandFunction } = await import(".");
			await exportCommandFunction(options);
			const endTime = Date.now();
			const duration = ((endTime - startTime) / 1000).toFixed(2);
			ChalkLogger.log();
			ChalkLogger.log(`Export completed successfully in ${duration}s`, { prefix: "SUCCESS" });
		});

	addOptionsToCommand(exportCommand, exportOptions);
};
