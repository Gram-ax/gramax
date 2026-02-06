import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import TableUtils from "@ext/markdown/core/edit/logic/Formatter/Utils/Table";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";

const tableFormatter =
	(formatter: FormatterType, context?: ParserContext): NodeSerializerSpec =>
	async (...args) => {
		const [state, node] = args;
		if (TableUtils.tableIsSimple(node)) {
			const table = await TableUtils.getSimpleTable(node, state.delim, context);
			state.write(table);
		} else {
			await formatter.nodeFormatters.table(...args);
		}
		state.closeBlock(node);
	};

export default tableFormatter;
