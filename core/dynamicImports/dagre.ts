import { createDynamicImport } from "./createDynamicImport";

export const dagre = createDynamicImport<typeof import("dagre")>({
	importFunction: () => import("dagre"),
});

export default dagre;
