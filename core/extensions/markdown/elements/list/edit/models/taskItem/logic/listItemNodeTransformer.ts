import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";

const listItemNodeTransformer: NodeTransformerFunc = (node) => {
	if (node && node.type === "list_item") {
		if (typeof node.attrs.isTaskItem === "boolean") {
			node.type = "task_item";
			node.attrs = { checked: node.attrs.isTaskItem };

			return { isSet: true, value: node };
		}
	}
};

export default listItemNodeTransformer;
