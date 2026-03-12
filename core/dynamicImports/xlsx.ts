import { createDynamicImport } from "./createDynamicImport";

export const xlsx = createDynamicImport<typeof import("@e965/xlsx")>({
	importFunction: () => import("@e965/xlsx"),
});

export default xlsx;
