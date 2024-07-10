import { JSONContent } from "@tiptap/core";
import ParserContext from "../../../core/Parser/ParserContext/ParserContext";
import MarkdownFormatter from "../../../core/edit/logic/Formatter/Formatter";
import NodeTransformerFunc from "../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

function createParagraph(nodes: JSONContent[], type: string) {
	return { type: type, content: nodes };
}

const getTextNode = (content?: string, unsetMark?: boolean) => {
	if (unsetMark) return { type: "text", text: content };
	return { type: "text", marks: [{ type: "inlineMd" }], text: content };
};

const blockMdNodeTransformer = (markdownFormatter: MarkdownFormatter, context: ParserContext): NodeTransformerFunc => {
	return async (node) => {
		if (node?.type === "blockMd" && node.content.length > 1) {
			const content = node.content;
			const text = await markdownFormatter.render({ type: "doc", content }, context);
			node = { type: "blockMd", content: [getTextNode(text, true)] };
			return { isSet: true, value: node };
		}

		if (!node || !node.content || !(node.type === "paragraph" || node.type === "heading")) return;
		let hasSomeNode = false;
		const nodes: JSONContent[] = [];
		let textNodes: JSONContent[] = [];
		node.content.forEach((current, index) => {
			if (current.type === "blockMd" || current.type === "image") {
				if (textNodes.length > 0) {
					nodes.push(createParagraph(textNodes, node.type));
					textNodes = [];
				}

				if (current.type === "image" || current.content[0].type === "text") {
					nodes.push(current);
				} else {
					if (current.content[0].type === "paragraph") {
						current.content[0] = current.content[0].content[0];
						nodes.push(current);
					} else {
						nodes.push(current.content[0]);
					}
				}

				hasSomeNode = true;
				const nextNode = node.content[index + 2];
				if (nextNode?.text && nextNode.marks?.[0]?.type === "em") current.attrs.title = nextNode.text;
			} else {
				textNodes.push(current);
			}
		});
		if (!hasSomeNode) return;

		if (textNodes.length > 0) {
			nodes.push(createParagraph(textNodes, node.type));
		}
		return { isSet: true, value: nodes };
	};
};

export default blockMdNodeTransformer;
