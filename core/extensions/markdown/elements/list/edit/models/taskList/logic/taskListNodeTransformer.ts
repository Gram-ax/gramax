import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";

const taskListNodeTransformer: NodeTransformerFunc = (node) => {
	if (node && node.type === "bulletList") {
		if (node.attrs.containTaskList) {
			node.type = "taskList";
			node.attrs = {};

			return { isSet: true, value: node };
		}
	}
};

export default taskListNodeTransformer;
