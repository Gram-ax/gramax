import { createDynamicImport } from "@dynamicImports/createDynamicImport";

const pdfjs = createDynamicImport<typeof import("pdfjs-dist/legacy/build/pdf.mjs")>({
	importFunction: async () => {
		return await import("pdfjs-dist/legacy/build/pdf.mjs");
	},
	skipPreload: true,
});

export const getPdfjs = async () => {
	return await pdfjs();
};
