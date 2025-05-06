import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const textFormatter: NodeSerializerSpec = (state, node) => {
	state.text((node.marks ? node.text : node.text.trim()).replaceAll(" ", " "));
};

export default textFormatter;
