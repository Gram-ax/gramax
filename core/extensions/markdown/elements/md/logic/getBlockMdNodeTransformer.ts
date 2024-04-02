import ParserContext from "../../../core/Parser/ParserContext/ParserContext";
import MarkdownFormatter from "../../../core/edit/logic/Formatter/Formatter";
import NodeTransformerFunc from "../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const getTextNode = (content?: string, unsetMark?: boolean) => {
	if (unsetMark) return { type: "text", text: content };
	return { type: "text", marks: [{ type: "inlineMd" }], text: content };
};

const getBlockMdNodeTransformer = (
	markdownFormatter: MarkdownFormatter,
	context: ParserContext,
): NodeTransformerFunc => {
	return async (node) => {
		if (node?.type === "blockMd") {
			const content = node.content;
			const text = await markdownFormatter.render({ type: "doc", content }, context);
			node = { type: "blockMd", content: [getTextNode(text, true)] };
			return { isSet: true, value: node };
		}
		return null;
	};
};

export default getBlockMdNodeTransformer;
