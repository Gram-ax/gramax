import { fsArgOrder } from "./fsArgOrder";

describe("fsArgOrder", () => {
	test("passes the workspace path to the native scan_workspace binding", () => {
		expect(fsArgOrder.scan_workspace).toEqual(["scope", "path", "opts"]);
	});
});
