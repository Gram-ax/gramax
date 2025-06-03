import TableUtils from "@ext/markdown/core/edit/logic/Formatter/Utils/Table";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableCellFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(TableUtils.getOldCellAttributes(node.attrs));
	await state.renderContent(node);
};

export default tableCellFormatter;
