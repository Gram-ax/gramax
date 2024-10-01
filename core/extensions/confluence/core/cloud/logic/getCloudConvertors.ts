
import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import doc from "@ext/markdown/elements/article/confluence/doc";
import mediaGroup from "@ext/markdown/elements/attachment/confluence/mediaGroup";
import mediaInline from "@ext/markdown/elements/attachment/confluence/mediaInline";
import mediaSingle from "@ext/markdown/elements/attachment/confluence/mediaSingle";
import blockquote from "@ext/markdown/elements/blockquote/confluence/blockquote";
import codeBlock from "@ext/markdown/elements/codeBlockLowlight/confluence";
import extensionConverters from "@ext/markdown/elements/extension/confluence/extensionConverters";
import stubConverters from "@ext/markdown/elements/extension/confluence/stubConverters";
import heading from "@ext/markdown/elements/heading/confluence/heading";
import blockCard from "@ext/markdown/elements/link/confluence/blockCard";
import inlineCard from "@ext/markdown/elements/link/confluence/inlineCard";
import bulletList from "@ext/markdown/elements/list/confluence/bulletList";
import listItem from "@ext/markdown/elements/list/confluence/listItem";
import orderedList from "@ext/markdown/elements/list/confluence/orderedList";
import expand from "@ext/markdown/elements/note/confluence/expand";
import panel from "@ext/markdown/elements/note/confluence/panel";
import paragraph from "@ext/markdown/elements/paragraph/confluence/paragraph";
import layoutColumn from "@ext/markdown/elements/table/confluence/layoutColumn";
import layoutSection from "@ext/markdown/elements/table/confluence/layoutSection";
import table from "@ext/markdown/elements/table/confluence/table";
import tableCell from "@ext/markdown/elements/table/confluence/tableCell";
import tableColumn from "@ext/markdown/elements/table/confluence/tableColumn";
import tableHeader from "@ext/markdown/elements/table/confluence/tableHeader";
import tableRow from "@ext/markdown/elements/table/confluence/tableRow";
import date from "@ext/markdown/elements/text/confluence/date";
import emoji from "@ext/markdown/elements/text/confluence/emoji";
import mention from "@ext/markdown/elements/text/confluence/mention";
import placeholder from "@ext/markdown/elements/text/confluence/placeholder";
import rule from "@ext/markdown/elements/text/confluence/rule";
import status from "@ext/markdown/elements/text/confluence/status";
import text from "@ext/markdown/elements/text/confluence/text";

const getCloudConvertors = (): Record<string, NodeConverter> => {
	return {
		doc,
		paragraph,
		placeholder,
		hardBreak: paragraph,
		text,
		mention,
		heading,
		bulletList,
		orderedList,
		decisionList: bulletList,
		listItem,
		decisionItem: listItem,
		taskList: bulletList,
		taskItem: listItem,
		blockquote,
		expand,
		nestedExpand: expand,
		codeBlock,
		panel,
		table,
		tableHeader,
		tableRow,
		tableColumn,
		tableCell,
		layoutSection,
		layoutColumn,
		status,
		rule,
		emoji,
		blockCard,
		embedCard: blockCard,
		inlineCard,
		date,
		mediaSingle,
		mediaInline,
		mediaGroup,
		...extensionConverters,
		...stubConverters,
	};
};

export default getCloudConvertors;
