import { getParserTestData } from "@ext/markdown/core/Parser/test/getParserTestData";
import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";

const parse = async (text: string) => {
	const { parser, parseContext } = await getParserTestData();
	const content = await parser.parse(text, parseContext, "requestURL.com");
	return { renderTree: JSON.stringify(content.renderTree), html: await content.getHtmlValue.get() };
};

const findKbd = (node: unknown): Tag | null => {
	if (typeof node !== "object" || node === null) return null;
	const tag = node as Tag & { attrs?: { tag?: unknown } };
	if (tag.name === "Kbd") return tag;
	const children = (tag.children as unknown[]) ?? [];
	const nested = (tag.attrs?.tag as unknown[]) ?? [];
	for (const child of [...children, ...nested]) {
		if (Array.isArray(child)) {
			for (const c of child) {
				const found = findKbd(c);
				if (found) return found;
			}
			continue;
		}
		const found = findKbd(child);
		if (found) return found;
	}
	return null;
};

describe("kbd HTML tag parsing (gh#814)", () => {
	test("<kbd>Enter</kbd> keeps its text and drops no closing tag", async () => {
		const { renderTree, html } = await parse("Press <kbd>Enter</kbd> to confirm.");

		const parsed = JSON.parse(renderTree);
		const kbd = findKbd(parsed);
		expect(kbd).not.toBeNull();
		expect(kbd?.attributes?.text).toBe("Enter");

		// the closing tag must not leak into the output as raw text
		expect(renderTree).not.toContain("[/kbd]");
		expect(html).not.toContain("[/kbd]");
		expect(html).toContain(">Enter</kbd>");
	});
});
