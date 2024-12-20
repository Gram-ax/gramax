import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const orderedList: NodeSerializerSpec = async (state, node) => {
	const start: number = node.attrs.order || 1;
	await state.renderList(
		node,
		(i) => {
			const idx = String(start + i);
			return idx.length == 1 ? "   " : "    ";
		},
		(i) => {
			const idx = String(start + i);
			return idx + ". ";
		},
	);
};

export default orderedList;
