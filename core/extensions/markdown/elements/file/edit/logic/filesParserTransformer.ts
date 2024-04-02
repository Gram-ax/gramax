import NodeTransformerFunc from "../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const filesParserTransformer: NodeTransformerFunc = (node) => {
	if (node?.type == "text" && node.marks) {
		for (const mark of node.marks) {
			if (mark.type == "link" && mark.attrs.isFile) {
				mark.type = "file";
				mark.attrs = { ...mark.attrs };
			}
		}
	}

	return { isSet: false, value: node };
};

export default filesParserTransformer;
