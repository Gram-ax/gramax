import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import TableUtils from "@ext/markdown/core/edit/logic/Formatter/Utils/Table";
import type { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import reorderTableContent from "@ext/markdown/elements/table/edit/logic/formatters/reorderTableContent";

const tableFormatter =
	(formatter: FormatterType, context?: ParserContext): NodeSerializerSpec =>
	async (...args) => {
		const [state, node, ...otherArgs] = args;
		const newNode = reorderTableContent(node);
		if (TableUtils.tableIsSimple(newNode)) {
			const table = await TableUtils.getSimpleTable(newNode, state.delim, context);
			state.write(table);
		} else {
			await formatter.nodeFormatters.table(state, newNode, ...otherArgs);
		}
		state.closeBlock(newNode);
	};

export default tableFormatter;
