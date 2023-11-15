import NodeTransformerFunc from "../../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const imageNodeTransformer: NodeTransformerFunc = (node) => {
	if (node?.type === "paragraph" && node?.content?.[0]?.type === "image") {
		const text = node.content?.[2]?.text ?? null;
		node = node.content[0];
		if (text) node.attrs.title = text;
		return { isSet: true, value: node };
	}
	return null;
};

export default imageNodeTransformer;
