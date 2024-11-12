import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";

const taskListNodeTransformer: NodeTransformerFunc = (node) => {
	if (node && node.type === "bullet_list") {
		if (node.attrs.containTaskList) {
			node.type = "task_list";
			node.attrs = {};

			return { isSet: true, value: node };
		}
	}
};

export default taskListNodeTransformer;
