import pdfjs from "@dynamicImports/pdfjs";
import { createDynamicImport } from "./createDynamicImport";

const pdfParse = createDynamicImport<typeof import("@ics/modulith-pdf-parse")>({
	importFunction: async () => {
		await pdfjs();
		return import("@ics/modulith-pdf-parse");
	},
	skipPreloadInCl: true,
});

export default pdfParse;
