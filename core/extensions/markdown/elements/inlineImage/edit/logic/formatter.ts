import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const inlineImageFormatter: NodeSerializerSpec = (state, node) => {
	const hasSize = node.attrs?.width && node.attrs?.height;

	state.write(
		"![" +
			state.esc(node.attrs.alt || "") +
			"](" +
			(node.attrs.src?.includes?.(" ") ? `<${node.attrs.src}>` : node.attrs.src) +
			")" +
			(hasSize ? `{width=${node.attrs.width} height=${node.attrs.height}}` : ""),
	);
};

export default inlineImageFormatter;
