import { Node } from "prosemirror-model";

const inlineMdLeafText = (leafNode: Node): string => {
	if (leafNode.type.name == "inlineMd_component") return leafNode.attrs.text;
	return null;
};

export default inlineMdLeafText;
