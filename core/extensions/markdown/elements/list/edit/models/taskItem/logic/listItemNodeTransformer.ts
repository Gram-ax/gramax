import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";

const listItemNodeTransformer: NodeTransformerFunc = (node) => {
	if (node && node.type === "listItem") {
		if (typeof node.attrs.isTaskItem === "boolean") {
			node.type = "taskItem";
			node.attrs = { checked: node.attrs.isTaskItem };

			return { isSet: true, value: node };
		}
	}
};

export default listItemNodeTransformer;
