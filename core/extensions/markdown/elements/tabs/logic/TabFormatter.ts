import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const TabFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(
		`[tab:${node.attrs.name ? node.attrs.name : " "}:${node.attrs.icon ?? ""}:${node.attrs.tag ?? ""}]\n\n`,
	);
	await state.renderContent(node);
	state.write(`[/tab]`);
	state.closeBlock(node);
};

export default TabFormatter;
