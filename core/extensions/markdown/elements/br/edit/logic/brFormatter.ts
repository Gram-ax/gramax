import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const brFormatter: NodeSerializerSpec = (state, node, parent, index) => {
	for (let i = index + 1; i < parent.childCount; i++)
		if (parent.child(i).type != node.type) {
			state.write("\\\n");
			return;
		}
};

export default brFormatter;
