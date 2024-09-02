import { NodeSerializerSpec } from "../../../../core/edit/logic/Prosemirror/to_markdown";

const codeBlockFormatter: NodeSerializerSpec = (state, node) => {
	state.write("```" + (node.attrs.language || "") + "\n");
	state.text(node.textContent, false);
	state.ensureNewLine();
	state.write("```");
	state.closeBlock(node);
};

export default codeBlockFormatter;
