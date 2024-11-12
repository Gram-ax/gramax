import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import AttributeFormatter from "@ext/markdown/elements/view/render/logic/attributesFormatter";

const viewNodeFormatter: NodeSerializerSpec = (state, node) => {
	const { defs, orderby, groupby, select, display } = new AttributeFormatter().stringify(node.attrs);
	state.write(`[view:${defs}:${orderby}:${groupby}:${select}:${display}]`);
	state.closeBlock(node);
};

export default viewNodeFormatter;
