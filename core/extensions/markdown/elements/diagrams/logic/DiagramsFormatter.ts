import { NodeSerializerSpec } from "../../../core/edit/logic/Prosemirror/to_markdown";

const DiagramsFormatter: NodeSerializerSpec = (state, node) => {
	if (node.attrs.src) {
		const hasSize = node.attrs.width && node.attrs.height;
		state.write(
			`[${node.attrs.diagramName.toLowerCase()}:${node.attrs.src ?? ""}${
				node.attrs.title ? `:${node.attrs.title}` : ``
			}${hasSize ? `:${node.attrs.width}:${node.attrs.height}` : ""}]`,
		);
		state.closeBlock(node);
	} else {
		state.write(
			"```" + node.attrs.diagramName.toLowerCase() + (node.attrs.title ? `:${node.attrs.title}` : ``) + "\n",
		);
		state.text(node.attrs.content, false);
		state.ensureNewLine();
		state.write("```");
		state.closeBlock(node);
	}
};

export default DiagramsFormatter;
