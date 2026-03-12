import { createDynamicImport } from "@dynamicImports/createDynamicImport";

const pdfjs = createDynamicImport<typeof import("pdfjs-dist")>({
	importFunction: async () => {
		return await import("pdfjs-dist");
	},
	// pdfjs-dist (not pdfjs-dist/legacy) does not work in Node.js
	// Next.js on build tries to load pdfjs-dist to generate static html
	skipPreload: true,
});

export const getPdfjs = async () => {
	const lib = await pdfjs();
	// Next.js complains that .mjs scripts need to be imported explicitly.
	// Specifying a relative path bypasses this requirement.
	lib.GlobalWorkerOptions.workerSrc = new URL(
		"../../../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).toString();
	return lib;
};
