import { GesError, gesErrorCodeByStatus, toGesErrorCode } from "@ext/enterprise/errors/GesError";

describe("gesErrorCodeByStatus", () => {
	it.each([
		[401, "unauthorized"],
		[403, "unauthorized"],
		[404, "not-found"],
		[400, "invalid"],
		[422, "invalid"],
		[500, "unavailable"],
		[503, "unavailable"],
	] as const)("maps %i to %s", (status, code) => {
		expect(gesErrorCodeByStatus(status)).toBe(code);
	});
});

describe("toGesErrorCode", () => {
	it("keeps the code of a GesError", () => {
		expect(toGesErrorCode(new GesError("offline"))).toBe("offline");
	});

	it("reports anything else as unknown", () => {
		expect(toGesErrorCode(new TypeError("boom"))).toBe("unknown");
		expect(toGesErrorCode(undefined)).toBe("unknown");
	});
});
