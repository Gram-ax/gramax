import { transformPastedHTML } from "./transformPastedTypes";

describe("transformPastedHTML", () => {
	test("removes consecutive empty elements", () => {
		const html = "<p>до</p><p></p><p><br></p><p>после</p>";

		expect(transformPastedHTML(html)).toBe("<p>до</p><p>после</p>");
	});

	test("removes empty elements from nested containers", () => {
		const html = "<blockquote><p></p><p> </p><p>текст</p></blockquote>";

		expect(transformPastedHTML(html)).toBe("<blockquote><p>текст</p></blockquote>");
	});

	test("preserves elements with embedded content", () => {
		const html = '<p></p><p><img src="image.png"></p><p></p>';

		expect(transformPastedHTML(html)).toBe('<p><img src="image.png"></p>');
	});

	test("removes empty elements separated by text", () => {
		const html = "<span></span>текст<span></span>";

		expect(transformPastedHTML(html)).toBe("текст");
	});

	test("preserves whitespace-only inline elements", () => {
		const html = "<p>странице<span> </span><strong>Дашборды</strong>.</p>";

		expect(transformPastedHTML(html)).toBe(html);
	});

	test("preserves non-breaking whitespace in inline elements", () => {
		const html = "<p>странице<span>&nbsp;</span><strong>Дашборды</strong>.</p>";

		expect(transformPastedHTML(html)).toBe(html);
	});
});
