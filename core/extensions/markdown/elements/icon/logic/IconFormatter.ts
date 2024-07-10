import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const IconFormatter: NodeSerializerSpec = (state, node) => {
	state.write(`[icon:${node.attrs.code ?? ""}${node.attrs.color ? `:${node.attrs.color}` : ""}]`);
};

export default IconFormatter;
