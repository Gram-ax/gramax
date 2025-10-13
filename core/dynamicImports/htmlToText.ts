import { createDynamicImport } from "./createDynamicImport";

export const htmlToText = createDynamicImport<typeof import("html-to-text")>({
	importFunction: () => import("html-to-text"),
});

export default htmlToText;
