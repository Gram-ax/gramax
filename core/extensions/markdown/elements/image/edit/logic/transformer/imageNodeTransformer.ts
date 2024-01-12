import { schema } from "@ext/markdown/core/edit/logic/Prosemirror";
import { JSONContent } from "@tiptap/core";
import NodeTransformerFunc from "../../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

function createParagraph(text) {
	const textNode = schema.text(text);
	return schema.node("paragraph", {}, textNode).toJSON();
}

const imageNodeTransformer: NodeTransformerFunc = (node) => {
	if (!node || !node.content || node.type !== "paragraph") return;

	let hasImageNode = false;
	const nodes: JSONContent[] = [];
	const afterTextNodes: string[] = []

	node.content.forEach((current, index) => {
		const { type, marks, text } = current;
		if (type === "image") {
			nodes.push(current);
			hasImageNode = true;

			const nextNode = node.content[index + 2];
			if (nextNode?.text && nextNode.marks?.[0]?.type === "em") current.attrs.title = nextNode.text;
		} else if (type === "text" && text.trim()) {
			if (!marks || marks.every((mark) => mark.type !== "em")) {
				if(hasImageNode) {
					afterTextNodes.push(text)
				} else {
					nodes.push(createParagraph(text));
				}
			}
		}
	});

	if (!hasImageNode) return;
	
	if(afterTextNodes.length > 0) {
		nodes.push(createParagraph(afterTextNodes.join("")))
	}

	return { isSet: true, value: nodes };
};

export default imageNodeTransformer;
