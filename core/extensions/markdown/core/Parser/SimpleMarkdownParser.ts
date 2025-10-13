import type { RenderableTreeNode } from "../render/logic/Markdoc";

export default class SimpleMarkdownParser {
	async parse(source: string): Promise<RenderableTreeNode> {
		const Markdoc = await import("../render/logic/Markdoc");
		const ast = Markdoc.parse(source);
		const content = Markdoc.transform(ast);
		return content;
	}
}
