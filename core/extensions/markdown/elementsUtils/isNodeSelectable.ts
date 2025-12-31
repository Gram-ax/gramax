import { Node } from "@tiptap/pm/model";

export const isNodeSelectable = (node: Node) => {
	return node.isBlock && !node.type.spec.content;
};
