import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { RunGramaxExportPdfProps, HELPER_PKG } from "./exportConfig";
import ChalkLogger from "../../../../utils/ChalkLogger";
import { spawn } from "child_process";
import { CliPrintStatus } from "@ext/print/types";
import { logResult } from "../../utils/logger";

const statusMessages = {
	preparing: "Preparing elements",
	processing: "Processing elements",
	saving: "Saving document",
} as const;

type ExtendedPrintStatus = CliPrintStatus | "start-export" | "done-export";

const statusHandlers: Record<ExtendedPrintStatus, () => void> = {
	done: () => null, // needed in gramax-export-pdf
	"start-data-load": () => ChalkLogger.write(`${statusMessages.preparing}...`),
	"done-render": () => logResult(`${statusMessages.preparing}`, "SUCCESS_EXT"),
	"start-export": () => ChalkLogger.write(`${statusMessages.saving}...`),
	"done-export": () => logResult(`${statusMessages.saving}`, "SUCCESS_EXT"),
	"error-data-load": () => ChalkLogger.log("Data load failed."),
};

const logPrintStatus = (status: CliPrintStatus) => {
	if (typeof status === "string" && status.startsWith("done-print-element-")) {
		const match = status.match(/done-print-element-(\d+)\/(\d+)\|-pages-(\d+)/);
		if (match) {
			const [, current, total, pages] = match;
			ChalkLogger.write(`\r${statusMessages.processing}: ${current} of ${total} (pages: ${pages})`);
			return;
		}
	}
	if (typeof status === "string" && status.startsWith("done-print-document-")) {
		const match = status.match(/done-print-document-(\d+)/);
		if (match) {
			const [, pages] = match;
			logResult(`${statusMessages.processing}`, "SUCCESS_EXT", `(total pages: ${pages})`);
			return;
		}
	}

	const handler = statusHandlers[status];
	handler ? handler() : ChalkLogger.error(`Unknown status: ${status}`);
};

const runGramaxExportPdf = async (finalParams: RunGramaxExportPdfProps) => {
	return new Promise<boolean>((resolve, reject) => {
		const paramsString = JSON.stringify(finalParams);
		const encodedParams = Buffer.from(paramsString).toString("base64");

		const child = spawn(HELPER_PKG, [encodedParams], {
			stdio: ["pipe", "pipe", "pipe"],
			shell: true,
		});

		let stderr = "";

		child.stdout?.on("data", (data: Buffer) => {
			const output = data.toString().trim();

			const possibleStatuses = output.split("\n");
			possibleStatuses.forEach((status) => {
				logPrintStatus(status as CliPrintStatus);
			});
		});

		child.stderr?.on("data", (data) => {
			const error = data.toString();
			stderr += error;
		});

		child.on("close", (code) => {
			process.stdout.write("\r" + " ".repeat(50) + "\r");

			if (code === 0) {
				resolve(true);
			} else {
				reject(new DefaultError(`Process exited with code ${code}. Error: ${stderr}`));
			}
		});

		child.on("error", (error) => {
			reject(error);
		});
	});
};

export default runGramaxExportPdf;
