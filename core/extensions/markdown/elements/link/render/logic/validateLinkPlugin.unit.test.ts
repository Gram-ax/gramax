import MarkdownIt from "markdown-it/lib";
import Tokenizer from "../../../../core/render/logic/Markdoc/src/tokenizer";
import validateLinkPlugin from "./validateLinkPlugin";

describe("validateLinkPlugin", () => {
	it("allows file:/// and data:image but blocks javascript and non-image data", () => {
		const md = MarkdownIt();
		validateLinkPlugin(md);

		expect(md.validateLink("https://example.com")).toBe(true);

		expect(md.validateLink("file:///C:/path/to/file.txt")).toBe(true);
		expect(md.validateLink("javascript:alert(1)")).toBe(false);

		expect(md.validateLink("data:image/png;base64,abcd")).toBe(true);
		expect(md.validateLink("data:text/plain;base64,abcd")).toBe(false);
	});
});

describe("Tokenizer integration", () => {
	it("parses file:/// links into tokens with correct href", () => {
		const tokenizer = new Tokenizer();
		const tokens = tokenizer.tokenize("[my file](file:///C:/path/to/file.txt)");

		const inlineTokenChildrens = tokens.find((t) => t.type === "inline").children;
		const linkOpen = inlineTokenChildrens.find((t) => t.type === "link_open");
		expect(linkOpen).toBeDefined();

		const href = linkOpen.attrs?.find((a) => a[0] === "href")?.[1];
		expect(href).toBe("file:///C:/path/to/file.txt");
	});
});
