import renderDescriptionMetaTag from "./renderDescriptionMetaTag";

describe("renderDescriptionMetaTag", () => {
	it("renders an article description meta tag", () => {
		expect(renderDescriptionMetaTag("Article summary")).toBe('<meta name="description" content="Article summary">');
	});

	it.each([undefined, ""])("omits the tag for %s", (description) => {
		expect(renderDescriptionMetaTag(description)).toBe("");
	});

	it("escapes HTML attribute characters", () => {
		expect(renderDescriptionMetaTag('A & B <C> "quoted" with $& and $\'')).toBe(
			'<meta name="description" content="A &amp; B &lt;C&gt; &quot;quoted&quot; with $&amp; and $\'">',
		);
	});
});
