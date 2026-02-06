import { getFormatterTypeByContext } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { questionAnswerFormatter } from "@ext/markdown/elements/answer/edit/logic/questionAnswerFormatter";
import blockFieldFormatter from "@ext/markdown/elements/blockContentField/edit/logic/BlockFieldFormatter";
import blockPropertyFormatter from "@ext/markdown/elements/blockProperty/edit/logic/blockPropertyFormatter";
import brFormatter from "@ext/markdown/elements/br/edit/logic/brFormatter";
import codeBlockFormatter from "@ext/markdown/elements/codeBlockLowlight/edit/logic/codeBlockFormatter";
import inlineCutFormatter from "@ext/markdown/elements/cut/edit/logic/inlineCutFormatter";
import DiagramsFormatter from "@ext/markdown/elements/diagrams/edit/logic/diagramsFormatter";
import drawioFormatter from "@ext/markdown/elements/drawio/edit/logic/drawioFormatter";
import headingFormatter from "@ext/markdown/elements/heading/edit/logic/headingFormatter";
import hrFormatter from "@ext/markdown/elements/hr/edit/logic/hrFormatter";
import htmlNodeFormatter from "@ext/markdown/elements/html/edit/logic/htmlNodeFormatter";
import htmlTagNodeFormatters from "@ext/markdown/elements/htmlTag/edit/logic/htmlTagNodeFormatters";
import IconFormatter from "@ext/markdown/elements/icon/edit/logic/IconFormatter";
import imageNodeFormatter from "@ext/markdown/elements/image/edit/logic/imageNodeFormatter";
import inlineImageFormatter from "@ext/markdown/elements/inlineImage/edit/logic/formatter";
import inlinePropertyFormatter from "@ext/markdown/elements/inlineProperty/edit/logic/inlinePropertyFormatter";
import bulletList from "@ext/markdown/elements/list/edit/models/bulletList/logic/bulletListFormatter";
import listItemFormatter from "@ext/markdown/elements/list/edit/models/listItem/logic/listItemFormatter";
import orderedList from "@ext/markdown/elements/list/edit/models/orderList/logic/orderListFormatter";
import taskList from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListFormatter";
import blockMdComponentFormatter from "@ext/markdown/elements/md/edit/logic/blockMdComponentFormatter";
import blockMdFormatter from "@ext/markdown/elements/md/edit/logic/blockMdFormatter";
import inlineMdComponentFormatter from "@ext/markdown/elements/md/edit/logic/inlineMdComponentFormatter";
import OpenApiFormatter from "@ext/markdown/elements/openApi/edit/logic/OpenApiFormatter";
import paragraphFormatter from "@ext/markdown/elements/paragraph/edit/logic/paragraphFormatter";
import { questionFormatter } from "@ext/markdown/elements/question/edit/logic/questionFormatter";
import SnippetFormatter from "@ext/markdown/elements/snippet/edit/logic/SnippetFormatter";
import tableBodyRowSimple from "@ext/markdown/elements/table/edit/logic/formatters/tableBodyRowSimpleFormatter";
import tableCellSimple from "@ext/markdown/elements/table/edit/logic/formatters/tableCellSimpleFormatter";
import tableFormatter from "@ext/markdown/elements/table/edit/logic/formatters/tableFormatter";
import tableHeaderRowSimple from "@ext/markdown/elements/table/edit/logic/formatters/tableHeaderRowSimpleFormatter";
import tableSimpleFormatter from "@ext/markdown/elements/table/edit/logic/formatters/tableSimpleFormatter";
import TabFormatter from "@ext/markdown/elements/tabs/edit/logic/TabFormatter";
import TabsFormatter from "@ext/markdown/elements/tabs/edit/logic/TabsFormatter";
import textFormatter from "@ext/markdown/elements/text/edit/logic/textFormatter";
import unsupportedFormatter from "@ext/markdown/elements/unsupported/edit/logic/unsupportedFormatter";
import videoFormatter from "@ext/markdown/elements/video/edit/logic/videoFormatter";
import viewNodeFormatter from "@ext/markdown/elements/view/edit/logic/viewNodeFormatter";
import { NodeSerializerSpec } from "../../Prosemirror/to_markdown";

type NodeFormatterModifier = (formatters: { [node: string]: NodeSerializerSpec }) => void;

const getNodeFormatters = (
	context?: ParserContext,
	modifiers?: NodeFormatterModifier[],
): { [node: string]: NodeSerializerSpec } => {
	const formatter = getFormatterTypeByContext(context);
	const formatters = {
		code_block: codeBlockFormatter,
		diagrams: DiagramsFormatter(formatter),
		snippet: SnippetFormatter(formatter),
		openapi: OpenApiFormatter(formatter),
		icon: IconFormatter(formatter),
		tabs: TabsFormatter(formatter),
		tab: TabFormatter(formatter),
		note: formatter.nodeFormatters.note,
		html: htmlNodeFormatter(formatter),
		view: viewNodeFormatter(formatter),
		unsupported: unsupportedFormatter(formatter),
		image: imageNodeFormatter(formatter),
		inlineImage: inlineImageFormatter,
		taskList: taskList,
		orderedList: orderedList,
		bulletList: bulletList,
		listItem: listItemFormatter,
		"inline-property": inlinePropertyFormatter(formatter),
		"block-field": blockFieldFormatter(formatter),
		"block-property": blockPropertyFormatter(formatter),
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
		...htmlTagNodeFormatters,
		questionAnswer: questionAnswerFormatter(formatter),
		question: questionFormatter(formatter),
	};

	if (modifiers) {
		modifiers.forEach((modifier) => modifier(formatters));
	}

	return formatters;
};

export default getNodeFormatters;
