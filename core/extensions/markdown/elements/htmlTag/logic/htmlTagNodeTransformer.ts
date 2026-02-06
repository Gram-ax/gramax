import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";
import { isBlockHtmlTag, isInlineHtmlTag } from "@ext/markdown/elements/htmlTag/edit/logic/isHtmlTag";
import HtmlTagToComponent from "@ext/markdown/elements/htmlTag/logic/htmlTagToComponent/htmlTagToComponent";

const htmlTagNodeTransformer: NodeTransformerFunc = (node) => {
	if (!isInlineHtmlTag(node.type) && !isBlockHtmlTag(node.type)) return null;

	const nodeTransformer = HtmlTagToComponent[node.attrs.name];
	if (nodeTransformer) {
		const newNode = nodeTransformer(node);
		return { isSet: true, value: newNode };
	}

	node = {
		type: isInlineHtmlTag(node.type) ? "inlineHtmlTagComponent" : "blockHtmlTagComponent",
		attrs: { content: node },
	};
	return { isSet: true, value: node };
};

export default htmlTagNodeTransformer;
