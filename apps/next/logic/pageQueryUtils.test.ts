import { getNodeQuery } from "./pageQueryUtils";

describe("getNodeQuery", () => {
	it("flattens array values to slash-joined strings", () => {
		const result = getNodeQuery({ path: ["a", "b"] });
		expect(result.path).toBe("a/b");
	});

	it("passes through scalar string values unchanged", () => {
		const result = getNodeQuery({ mode: "read" });
		expect(result.mode).toBe("read");
	});

	it("omits null and undefined values", () => {
		const result = getNodeQuery({ a: undefined, b: null, c: "x" });
		expect(result).not.toHaveProperty("a");
		expect(result).not.toHaveProperty("b");
		expect(result.c).toBe("x");
	});

	it("sets l from Localizer.extract of the articlePath", () => {
		const result = getNodeQuery({}, "/test-catalog");
		// /test-catalog has no recognisable language segment → undefined
		expect(result.l).toBeUndefined();
	});

	it("extracts language from articlePath when present", () => {
		// Localizer reads the third path segment: /{workspace}/{lang}/{article}
		const result = getNodeQuery({}, "/catalog/ru/article");
		expect(result.l).toBe("ru");
	});
});
