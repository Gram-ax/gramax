import bookmark from "@ext/markdown/elements/paragraph/notion/bookmark";
import list from "@ext/markdown/elements/list/notion/bulletList";
import callout from "@ext/markdown/elements/note/notion/callout";
import column from "@ext/markdown/elements/table/notion/column";
import columnList from "@ext/markdown/elements/list/notion/columnList";
import divider from "@ext/markdown/elements/hr/notion/divider";
import embed from "@ext/markdown/elements/paragraph/notion/embed";
import gramaxParagraph from "@ext/markdown/elements/paragraph/notion/gramaxParagraph";
import heading from "@ext/markdown/elements/heading/notion/heading";
import image from "@ext/markdown/elements/image/notion/image";
import listItem from "@ext/markdown/elements/list/notion/listItem";
import paragraph from "@ext/markdown/elements/paragraph/notion/paragraph";
import syncBlock from "@ext/markdown/elements/paragraph/notion/syncBlock";
import table from "@ext/markdown/elements/table/notion/table";
import tableRow from "@ext/markdown/elements/table/notion/tableRow";
import taskItem from "@ext/markdown/elements/list/notion/taskItem";
import taskList from "@ext/markdown/elements/list/notion/taskList";
import toggle from "@ext/markdown/elements/note/notion/toggle";
import video from "@ext/markdown/elements/video/notion/video";
import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";
import file from "@ext/markdown/elements/file/notion/file";
import code from "@ext/markdown/elements/codeBlockLowlight/notion/code";
import equation from "@ext/markdown/elements/formula/notion/equation";
import quote from "@ext/markdown/elements/note/notion/quote";
import text from "@ext/markdown/elements/text/notion/text";
import childPage from "@ext/markdown/elements/link/notion/childPage";
import linkToPage from "@ext/markdown/elements/link/notion/linkToPage";

const gramaxNode: NotionNodeConverter = (node) => node;

const getNotionConvertors = (): Record<string, NotionNodeConverter> => {
	return {
		doc: gramaxNode,
		paragraph,
		gramaxParagraph,
		text,
		bulleted_list_item: list,
		numbered_list_item: list,
		to_do: taskList,
		taskItem,
		listItem,
		heading_1: heading,
		heading_2: heading,
		heading_3: heading,
		quote,
		equation,
		toggle,
		table,
		table_row: tableRow,
		tableCell: gramaxNode,
		tableHeader: gramaxNode,
		callout,
		mention: text,
		divider,
		child_page: childPage,
		child_database: childPage,
		code,
		image,
		video,
		bookmark,
		column_list: columnList,
		column,
		tableRow: gramaxNode,
		embed,
		file,
		audio: file,
		link_preview: embed,
		pdf: file,
		synced_block: syncBlock,
		link_to_page: linkToPage,
		view: gramaxNode,
	};
};

export default getNotionConvertors;
