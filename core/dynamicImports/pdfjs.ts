import { createDynamicImport } from "./createDynamicImport";

const pdfjs = createDynamicImport<typeof import("pdfjs-dist")>({
	importFunction: () => import("pdfjs-dist"),
});

export default pdfjs;
