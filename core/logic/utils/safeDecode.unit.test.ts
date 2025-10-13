import safeDecode from "./safeDecode";

describe("safeDecode", () => {
	it("decodes well-formed URI components", () => {
		expect(safeDecode("foo%20bar")).toBe("foo bar");
	});

	it("returns original string when decoding fails", () => {
		const input = "foo%bar";
		expect(() => decodeURIComponent(input)).toThrow(URIError);
		expect(safeDecode(input)).toBe(input);
	});

	it("returns empty string when value is falsy", () => {
		expect(safeDecode(undefined)).toBe("");
		expect(safeDecode("")).toBe("");
	});
});
