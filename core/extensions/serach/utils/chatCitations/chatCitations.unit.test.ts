import { Tag as MarkdocTag } from "@ext/markdown/core/render/logic/Markdoc";
import { makeCitationPlaceholder } from "@ext/serach/types";
import chatCitations from "./chatCitations";

describe("chatCitations", () => {
	it("replaces placeholder with Link tag when meta exists", () => {
		const logicPath = "catalog/article-1";
		const relativePath = "./article-1.md";
		const placeholder = makeCitationPlaceholder(1, logicPath, relativePath);
		const root = `Text before ${placeholder} and after`;
		const transformed = chatCitations(root) as any[];

		expect(transformed.length).toBe(3);
		expect(transformed[0]).toBe("Text before ");
		expect(transformed[2]).toBe(" and after");

		const tag = transformed[1] as MarkdocTag;
		expect(tag).toBeInstanceOf(MarkdocTag);
		expect(tag.name).toBe("Link");
		expect(tag.attributes.index).toBe(1);
		expect(tag.attributes.href).toBe(`/${logicPath}`);
		expect(tag.attributes.resourcePath).toBe(relativePath);
		expect(tag.children).toEqual(["¹↗"]);
	});

	it("returns original string when no placeholders", () => {
		const root = "Just a plain string without placeholders";
		const transformed = chatCitations(root) as any[];
		expect(transformed).toEqual(root);
	});
});
