import { PdfPrintParams } from "@ext/print/types";

export interface RunGramaxExportPdfProps {
	source: string;
	output: string;
	params?: PdfPrintParams;
}

export const HELPER_PKG = "gramax-export-pdf";

export const packageManagers = {
	yarn: `"yarn global add ${HELPER_PKG}`,
	pnpm: `pnpm add -g ${HELPER_PKG}`,
	bun: `bun add -g ${HELPER_PKG}`,
	npm: `npm i -g ${HELPER_PKG}`,
};
