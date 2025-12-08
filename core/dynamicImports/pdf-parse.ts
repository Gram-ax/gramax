import pdfjs from "@dynamicImports/pdfjs";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { createDynamicImport } from "./createDynamicImport";

const pdfParse = createDynamicImport<typeof import("@ics/modulith-pdf-parse")>({
	importFunction: async () => {
		(await pdfjs()).GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
		return import("@ics/modulith-pdf-parse");
	},
});

export default pdfParse;
