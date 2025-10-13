import { createDynamicImport } from "./createDynamicImport";

export const jszip = createDynamicImport<typeof import("jszip")>({
	importFunction: () => import("jszip").then((m) => m.default),
});

export default jszip;
