import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import TableUtils from "@ext/markdown/core/edit/logic/Formatter/Utils/Table";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableFormatter =
	(formatter: FormatterType, context?: ParserContext): NodeSerializerSpec =>
	async (state, node, ...other) => {
		if (TableUtils.tableIsSimple(node)) {
			const delim = state.delim;
			state.delim = "";
			state.write(await TableUtils.getSimpleTable(node, delim, context));
			state.delim = delim;
		} else {
			await formatter.nodeFormatters.table(state, node, ...other);
		}
		state.closeBlock(node);
	};

export default tableFormatter;
