import { createDynamicImport } from "./createDynamicImport";

export const pdfmake = createDynamicImport<typeof import("pdfmake/build/pdfmake")>({
	importFunction: () => import("pdfmake/build/pdfmake").then((m) => m.default),
});

export default pdfmake;
