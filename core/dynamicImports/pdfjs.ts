import { createDynamicImport } from "./createDynamicImport";

const pdfjs = createDynamicImport<typeof import("pdfjs-dist")>({
	importFunction: async () => {
		const [lib, workerModule] = await Promise.all([
			import("pdfjs-dist"),
			import("pdfjs-dist/build/pdf.worker.entry"),
		]);
		const workerSrc = (workerModule as { default: string }).default;
		lib.GlobalWorkerOptions.workerSrc = workerSrc;
		return lib;
	},
	skipPreloadInCl: true,
});

export const pdfjsWorkerUrl = createDynamicImport<string>({
	importFunction: () => import("pdfjs-dist/build/pdf.worker.min.js?url").then((m) => m.default),
	skipPreloadInCl: true,
});

export default pdfjs;
