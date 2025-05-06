import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import codeBlockFormatter from "@ext/markdown/elements/codeBlockLowlight/edit/logic/codeBlockFormatter";
import DiagramsFormatter from "@ext/markdown/elements/diagrams/edit/logic/diagramsFormatter";
import htmlNodeFormatter from "@ext/markdown/elements/html/edit/logic/htmlNodeFormatter";
import IconFormatter from "@ext/markdown/elements/icon/edit/logic/IconFormatter";
import imageNodeFormatter from "@ext/markdown/elements/image/edit/logic/imageNodeFormatter";
import bulletList from "@ext/markdown/elements/list/edit/models/bulletList/logic/bulletListFormatter";
import orderedList from "@ext/markdown/elements/list/edit/models/orderList/logic/orderListFormatter";
import taskItem from "@ext/markdown/elements/list/edit/models/taskItem/logic/taskItemFormatter";
import taskList from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListFormatter";
import noteFormatter from "@ext/markdown/elements/note/edit/logic/noteFormatter";
import OpenApiFormatter from "@ext/markdown/elements/openApi/edit/logic/OpenApiFormatter";
import SnippetFormatter from "@ext/markdown/elements/snippet/edit/logic/SnippetFormatter";
import TabFormatter from "@ext/markdown/elements/tabs/edit/logic/TabFormatter";
import TabsFormatter from "@ext/markdown/elements/tabs/edit/logic/TabsFormatter";
import unsupportedFormatter from "@ext/markdown/elements/unsupported/edit/logic/unsupportedFormatter";
import viewNodeFormatter from "@ext/markdown/elements/view/edit/logic/viewNodeFormatter";
import listItemFormatter from "@ext/markdown/elements/list/edit/models/listItem/logic/listItemFormatter";
import inlinePropertyFormatter from "@ext/markdown/elements/inlineProperty/edit/logic/inlinePropertyFormatter";
import blockFieldFormatter from "@ext/markdown/elements/blockContentField/edit/logic/BlockFieldFormatter";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import blockMdFormatter from "@ext/markdown/elements/md/edit/logic/blockMdFormatter";
import blockMdComponentFormatter from "@ext/markdown/elements/md/edit/logic/blockMdComponentFormatter";
import inlineMdComponentFormatter from "@ext/markdown/elements/md/edit/logic/inlineMdComponentFormatter";
import videoFormatter from "@ext/markdown/elements/video/edit/logic/videoFormatter";
import { NodeSerializerSpec } from "../../Prosemirror/to_markdown";
import tableFormatter from "@ext/markdown/elements/table/edit/logic/formatters/tableFormatter";
import tableSimpleFormatter from "@ext/markdown/elements/table/edit/logic/formatters/tableSimpleFormatter";
import tableCellSimple from "@ext/markdown/elements/table/edit/logic/formatters/tableCellSimpleFormatter";
import tableBodyRowSimple from "@ext/markdown/elements/table/edit/logic/formatters/tableBodyRowSimpleFormatter";
import tableHeaderRowSimple from "@ext/markdown/elements/table/edit/logic/formatters/tableHeaderRowSimpleFormatter";
import drawioFormatter from "@ext/markdown/elements/drawio/edit/logic/drawioFormatter";
import inlineCutFormatter from "@ext/markdown/elements/cut/edit/logic/inlineCutFormatter";
import headingFormatter from "@ext/markdown/elements/heading/edit/logic/headingFormatter";
import hrFormatter from "@ext/markdown/elements/hr/edit/logic/hrFormatter";
import paragraphFormatter from "@ext/markdown/elements/paragraph/edit/logic/paragraphFormatter";
import textFormatter from "@ext/markdown/elements/text/edit/logic/textFormatter";
import brFormatter from "@ext/markdown/elements/br/edit/logic/brFormatter";

const getNodeFormatters = (context?: ParserContext): { [node: string]: NodeSerializerSpec } => {
	const formatter = getFormatterType(context);
	return {
		code_block: codeBlockFormatter,
		diagrams: DiagramsFormatter(formatter),
		snippet: SnippetFormatter(formatter),
		openapi: OpenApiFormatter(formatter),
		icon: IconFormatter(formatter),
		tabs: TabsFormatter(formatter),
		tab: TabFormatter(formatter),
		note: noteFormatter(formatter),
		html: htmlNodeFormatter(formatter),
		view: viewNodeFormatter(formatter),
		unsupported: unsupportedFormatter(formatter),
		image: imageNodeFormatter(formatter),
		taskItem: taskItem,
		taskList: taskList,
		orderedList: orderedList,
		bulletList: bulletList,
		listItem: listItemFormatter,
		"inline-property": inlinePropertyFormatter(formatter),
		"block-field": blockFieldFormatter(formatter),
		inlineMd_component: inlineMdComponentFormatter,
		blockMd_component: blockMdComponentFormatter,
		blockMd: blockMdFormatter,
		video: videoFormatter(formatter),
		drawio: drawioFormatter(formatter),
		inlineCut_component: inlineCutFormatter(formatter),
		table: tableFormatter(formatter, context),
		tableRow: formatter.nodeFormatters.tableRow,
		tableCell: formatter.nodeFormatters.tableCell,
		table_simple: tableSimpleFormatter,
		tableCell_simple: tableCellSimple,
		tableHeader_simple: tableCellSimple,
		tableBodyRow_simple: tableBodyRowSimple,
		tableHeaderRow_simple: tableHeaderRowSimple,
		heading: headingFormatter,
		horizontal_rule: hrFormatter,
		paragraph: paragraphFormatter,
		hard_break: brFormatter,
		br: brFormatter,
		text: textFormatter,
	};
};

export default getNodeFormatters;
