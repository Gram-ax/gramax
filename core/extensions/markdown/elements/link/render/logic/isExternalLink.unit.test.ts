import linkCreator from "./linkCreator";

describe("LinkCreator.isExternalLink", () => {
	describe("treats real external links as external", () => {
		test("anchor", () => {
			expect(linkCreator.isExternalLink("#section")).toBe(true);
		});

		test("query", () => {
			expect(linkCreator.isExternalLink("?query=1")).toBe(true);
		});

		test("url with scheme", () => {
			expect(linkCreator.isExternalLink("https://example.com")).toBe(true);
			expect(linkCreator.isExternalLink("mailto:a@b.c")).toBe(true);
		});

		test("internal api resource path", () => {
			expect(linkCreator.isExternalLink("/api/resource")).toBe(true);
		});
	});

	describe("treats relative links as internal", () => {
		test("plain relative article link", () => {
			expect(linkCreator.isExternalLink("some-article.md")).toBe(false);
			expect(linkCreator.isExternalLink("./folder/article")).toBe(false);
		});

		// Regression: any href whose 2nd-4th chars spell "api" (e.g. "rapid…",
		// "sapiens…", "napkin…") was wrongly classified as external, so getLink
		// returned an empty result and the relative link never resolved (#445).
		test("relative link whose 2nd-4th chars are 'api' stays internal", () => {
			expect(linkCreator.isExternalLink("rapid-start.md")).toBe(false);
			expect(linkCreator.isExternalLink("sapiens.png")).toBe(false);
			expect(linkCreator.isExternalLink("napkin/notes")).toBe(false);
		});
	});
});
