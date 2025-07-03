import { JSONContent } from "@tiptap/core";
import NodeTransformerFunc from "../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

function createParagraph(nodes: JSONContent[], type: string) {
	return { type: type, content: nodes };
}

const blockMdNodeTransformer: NodeTransformerFunc = (node) => {
	if (!node || !node.content || !(node.type === "paragraph" || node.type === "heading")) return;

	let hasSomeNode = false;
	const nodes: JSONContent[] = [];
	let textNodes: JSONContent[] = [];
	node.content.forEach((current, index) => {
		if (current.type === "blockMd") {
			if (textNodes.length > 0) {
				nodes.push(createParagraph(textNodes, node.type));
				textNodes = [];
			}

			if (current.content[0].type === "text") {
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

export default blockMdNodeTransformer;
