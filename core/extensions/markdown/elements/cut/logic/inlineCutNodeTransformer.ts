import NodeTransformerFunc from "../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const inlineCutNodeTransformer: NodeTransformerFunc = (node, nextNode) => {
	if (node?.marks) {
		const inlineMdIndex = node.marks.findIndex((mark) => mark.type === "inlineCut");
		if (inlineMdIndex !== -1) {
			let nextInlineMdIndex = -1;
			if (nextNode?.marks) nextInlineMdIndex = nextNode.marks.findIndex((mark) => mark.type === "inlineCut");
			if (
				nextInlineMdIndex !== -1 &&
				JSON.stringify(node?.marks[inlineMdIndex].attrs) ==
					JSON.stringify(nextNode?.marks[nextInlineMdIndex].attrs)
			) {
				nextNode.content = [
					{ type: node.type, text: node.text },
					{ type: nextNode.type, ...(nextNode?.text ? { text: nextNode?.text } : {}) },
				];
				nextNode.type = "inlineCut_component";
				nextNode.attrs = node?.marks[inlineMdIndex].attrs;
				nextNode.marks = null;
				node = null;
			} else {
				node = {
					type: "inlineCut_component",
					attrs: node?.marks[inlineMdIndex].attrs,
					content: [{ type: node.type, text: node.text }],
				};
			}
			return { isSet: true, value: node };
		}
	}
	if (node?.type == "inlineCut_component" && nextNode?.marks) {
		const nextInlineMdIndex = nextNode.marks.findIndex((mark) => mark.type === "inlineCut");
		if (
			nextInlineMdIndex !== -1 &&
			JSON.stringify(node?.attrs) == JSON.stringify(nextNode?.marks[nextInlineMdIndex].attrs)
		) {
			nextNode.content = [
				...node.content,
				{ type: nextNode.type, ...(nextNode?.text ? { text: nextNode?.text } : {}) },
			];
			nextNode.type = "inlineCut_component";
			nextNode.attrs = node?.attrs;
			nextNode.marks = null;
			node = null;
			return { isSet: true, value: node };
		}
	}
};

export default inlineCutNodeTransformer;
