import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";

const unsupportedNodeTransformer: NodeTransformerFunc = (node) => {
	if (node.type === "unsupported") {
		const fenceElement = node.content.find((element) => element.type === "code_block");
		if (!fenceElement) return;
		node.attrs.code = fenceElement?.content[0]?.text ?? "";
		delete node.content;
		return { isSet: true, value: node };
	}
	return;
};

export default unsupportedNodeTransformer;
