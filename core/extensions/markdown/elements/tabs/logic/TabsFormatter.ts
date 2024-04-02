import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";

const TabsFormatter: NodeSerializerSpec = async (state, node) => {
	node.attrs.childAttrs.map((attrs: TabAttrs, idx: number) => {
		(node.child(idx).attrs as any) = attrs;
	});
	state.write(`[tabs]\n\n`);
	await state.renderContent(node);
	state.write(`[/tabs]`);
	state.closeBlock(node);
};

export default TabsFormatter;
