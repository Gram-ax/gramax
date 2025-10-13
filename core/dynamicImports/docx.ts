import { createDynamicImport } from "./createDynamicImport";

export const docx = createDynamicImport<typeof import("docx")>({
	importFunction: () => import("docx"),
});

export default docx;
