import { createDynamicImport } from "./createDynamicImport";

export const docxPreview = createDynamicImport<typeof import("docx-preview")>({
	importFunction: () => import("docx-preview"),
});

export default docxPreview;
