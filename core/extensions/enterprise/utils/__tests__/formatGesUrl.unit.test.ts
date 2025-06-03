import { formatGesUrl } from "../formatGesUrl";

describe("formatGesUrl", () => {
	it("should handle empty input", () => {
		expect(formatGesUrl("")).toBe("");
		expect(formatGesUrl(null as any)).toBe(null);
		expect(formatGesUrl(undefined as any)).toBe(undefined);
	});

	it("should remove trailing slashes", () => {
		expect(formatGesUrl("https://example.com/")).toBe("https://example.com");
		expect(formatGesUrl("https://example.com//")).toBe("https://example.com");
		expect(formatGesUrl("https://example.com///")).toBe("https://example.com");
	});

	it("should remove everything after slash that follows a dot", () => {
		expect(formatGesUrl("https://example.com/path")).toBe("https://example.com");
		expect(formatGesUrl("https://sub.example.com/path")).toBe("https://sub.example.com");
		expect(formatGesUrl("https://sub.example.com/path/more")).toBe("https://sub.example.com");
	});

	it("should preserve URLs without slashes after dots", () => {
		expect(formatGesUrl("https://example.com")).toBe("https://example.com");
		expect(formatGesUrl("https://sub.example.com")).toBe("https://sub.example.com");
		expect(formatGesUrl("https://sub.domain.example.com")).toBe("https://sub.domain.example.com");
	});

	it("should trim whitespace", () => {
		expect(formatGesUrl(" https://example.com ")).toBe("https://example.com");
		expect(formatGesUrl("\thttps://example.com\n")).toBe("https://example.com");
	});

	it("should handle complex cases", () => {
		expect(formatGesUrl("https://sub.example.com/path/")).toBe("https://sub.example.com");
		expect(formatGesUrl(" https://sub.example.com/path// ")).toBe("https://sub.example.com");
		expect(formatGesUrl("https://sub.domain.example.com/path/to/something/")).toBe(
			"https://sub.domain.example.com",
		);
	});
});
