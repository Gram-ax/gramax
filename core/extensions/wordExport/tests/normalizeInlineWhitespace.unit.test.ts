import { normalizeInlineWhitespace } from "../utils/normalizeInlineWhitespace";

describe("normalizeInlineWhitespace", () => {
	it("keeps regular text untouched", () => {
		expect(normalizeInlineWhitespace("Hello world"))
			.toBe("Hello world");
	});

	it("collapses multiple spaces into one", () => {
		expect(normalizeInlineWhitespace("Hello   world"))
			.toBe("Hello world");
	});

	it("replaces tabs with single spaces", () => {
		expect(normalizeInlineWhitespace("Hello\tworld"))
			.toBe("Hello world");
	});

	it("turns line breaks with surrounding whitespace into a single space", () => {
		const raw = "Hello \n\t world";
		expect(normalizeInlineWhitespace(raw)).toBe("Hello world");
	});

	it("preserves single leading and trailing spaces", () => {
		expect(normalizeInlineWhitespace(" leading and trailing "))
			.toBe(" leading and trailing ");
	});
});
