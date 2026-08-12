import renderOpenApiCode from "@ext/markdown/elements/openApi/render/openApiCode";

/**
 * The bridge between an `x-codeSamples` sample and Gramax's own highlighter. The viewer supplies `lang`
 * exactly as the spec author wrote it, so what is specified here is this module's own decisions: which names
 * reach a grammar, what a sample looks like before its grammar has loaded, and what the block does not wrap.
 */
describe("OpenAPI code samples through the Gramax highlighter", () => {
	test("keeps the sample source", () => {
		expect(renderOpenApiCode("curl -X GET /cpes", { lang: "Shell" })).toContain("curl -X GET /cpes");
	});

	test("escapes markup characters in the sample source", () => {
		const html = renderOpenApiCode('curl -H "X: <token>"', { lang: "Shell" });
		expect(html).toContain("&lt;token&gt;");
		expect(html).not.toContain("<token>");
	});

	test("leaves a sample whose lang names no grammar untokenized", () => {
		expect(renderOpenApiCode("use LWP::UserAgent;", { lang: "Perl (LWP)" })).not.toContain("hljs-");
	});

	test("leaves a sample that declares no lang untokenized", () => {
		expect(renderOpenApiCode("plain sample", { lang: "" })).not.toContain("hljs-");
	});

	test("wraps no block of its own around the tokens — the viewer's <pre> owns the block", () => {
		expect(renderOpenApiCode("import requests", { lang: "Python" })).not.toContain('class="hljs"');
	});

	test("loads the grammar a lang names, and tokenizes the sample on the next render", async () => {
		expect(renderOpenApiCode("echo hi", { lang: "Bash" })).not.toContain("hljs-");
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(renderOpenApiCode("echo hi", { lang: "Bash" })).toContain("hljs-");
	});
});
