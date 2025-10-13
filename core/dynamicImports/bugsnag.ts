import { createDynamicImport } from "./createDynamicImport";

export const bugsnag = createDynamicImport<typeof import("@bugsnag/js")>({
	importFunction: () => import("@bugsnag/js"),
});

export default bugsnag;
