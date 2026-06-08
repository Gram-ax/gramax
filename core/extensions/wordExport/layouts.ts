import { alfaWordLayout, betaWordLayout } from "@ext/markdown/elements/alfaBeta/word/alfabeta";
import { blockPropertyWordLayout } from "@ext/markdown/elements/blockProperty/word/blockProperty";
import { blockquoteWordLayout } from "@ext/markdown/elements/blockquote/word/blockquote";
import { brWordLayout } from "@ext/markdown/elements/br/word/br";
import { cmdWordLayout } from "@ext/markdown/elements/cmd/word/cmd";
import { codeWordLayout } from "@ext/markdown/elements/code/word/code";
import { fenceWordLayout } from "@ext/markdown/elements/codeBlockLowlight/word";
import { colorWordLayout } from "@ext/markdown/elements/color/word/color";
import { commentWordLayout } from "@ext/markdown/elements/comment/word/comment";
import { cutBlockWordLayout } from "@ext/markdown/elements/cut/word/cutBlock";
import { cutInlineWordLayout } from "@ext/markdown/elements/cut/word/cutInline";
import { drawioWordLayout } from "@ext/markdown/elements/drawio/word/drawio";
import { emWordLayout } from "@ext/markdown/elements/em/word/em";
import { fragmentWordLayout } from "@ext/markdown/elements/fragment/word/fragment";
import { fragmentLinkWordLayout } from "@ext/markdown/elements/fragment-link/word/fragmentLink";
import { headingWordLayout } from "@ext/markdown/elements/heading/word/heading";
import { highlightWordLayout } from "@ext/markdown/elements/highlight/word/highlight";
import { hrWordLayout } from "@ext/markdown/elements/hr/word/hr";
import { iconWordLayout } from "@ext/markdown/elements/icon/render/word/icon";
import { renderImageWordLayout } from "@ext/markdown/elements/image/word/image";
import { includeWordLayout } from "@ext/markdown/elements/include/word/include";
import { renderInlineImageWordLayout } from "@ext/markdown/elements/inlineImage/word/inlineImage";
import { inlinePropertyWordLayout } from "@ext/markdown/elements/inlineProperty/word/inlineProperty";
import { issueWordLayout } from "@ext/markdown/elements/issue/word/issue";
import { kbdWordLayout } from "@ext/markdown/elements/kbd/word/kbd";
import { linkWordLayout } from "@ext/markdown/elements/link/word/link";
import { ulListWordLayout } from "@ext/markdown/elements/list/word/bulletList";
import { listItemWordLayout } from "@ext/markdown/elements/list/word/listItem";
import { orderListWordLayout } from "@ext/markdown/elements/list/word/orderListWordLayout";
import { taskListWordLayout } from "@ext/markdown/elements/list/word/taskList";
import { moduleWordLayout } from "@ext/markdown/elements/module/word/module";
import { noteWordLayout } from "@ext/markdown/elements/note/word/note";
import { paragraphWordLayout } from "@ext/markdown/elements/paragraph/word/paragraph";
import { strikeWordLayout } from "@ext/markdown/elements/strikethrough/word/strike";
import { strongWordLayout } from "@ext/markdown/elements/strong/word/strong";
import { tableWordLayout } from "@ext/markdown/elements/table/word/table";
import { tableLayout } from "@ext/markdown/elements/table/word/transformer/getTableChilds";
import { tabsWordLayout } from "@ext/markdown/elements/tabs/word/tabs";
import { termWordLayout } from "@ext/markdown/elements/term/word/term";
import { viewWordLayout } from "@ext/markdown/elements/view/word/view";
import { whenWordLayout, whoWordLayout } from "@ext/markdown/elements/whowhen/word/whoWhen";
import { diagramdbWordLayout } from "../markdown/elements/diagramdb/word/diagramdb";
import { diagramsWordLayout } from "../markdown/elements/diagrams/word/diagrams";
// import { imagesWordLayout } from "@ext/markdown/elements/imgs/word/imgs";
// import { seeWordLayout } from "@ext/markdown/elements/see/word/see";
import { formulaWordBlockLayout, formulaWordInlineLayout } from "../markdown/elements/formula/word/formula";
import { tabledbWordlayout } from "../markdown/elements/tabledb/word/tabledb";
import { videoWordLayout } from "../markdown/elements/video/word/video";

export const inlineLayouts = {
	strong: strongWordLayout,
	em: emWordLayout,
	Link: linkWordLayout,
	Code: codeWordLayout,
	Br: brWordLayout,
	br: brWordLayout,
	Color: colorWordLayout,
	highlight: highlightWordLayout,
	Alfa: alfaWordLayout,
	Beta: betaWordLayout,
	Who: whoWordLayout,
	When: whenWordLayout,
	Issue: issueWordLayout,
	Kbd: kbdWordLayout,
	Cmd: cmdWordLayout,
	Module: moduleWordLayout,
	Cut: cutInlineWordLayout,
	Term: termWordLayout,
	icon: iconWordLayout,
	s: strikeWordLayout,
	"inline-property": inlinePropertyWordLayout,
	inlineImage: renderInlineImageWordLayout,
	comment: commentWordLayout,
	Formula: formulaWordInlineLayout,
	"Fragment-link": fragmentLinkWordLayout,
	//Fn
};

export const blockLayouts = {
	p: paragraphWordLayout,
	orderedList: orderListWordLayout,
	bulletList: ulListWordLayout,
	taskList: taskListWordLayout,
	listItem: listItemWordLayout,
	Heading: headingWordLayout,
	table: tableWordLayout,
	note: noteWordLayout,
	code_block: fenceWordLayout,
	Cut: cutBlockWordLayout,
	blockquote: blockquoteWordLayout,
	Include: includeWordLayout,
	drawio: drawioWordLayout,
	hr: hrWordLayout,
	tabs: tabsWordLayout,
	fragment: fragmentWordLayout,
	Video: videoWordLayout,
	Image: renderImageWordLayout,
	"Db-diagram": diagramdbWordLayout,
	"Db-table": tabledbWordlayout,
	"block-property": blockPropertyWordLayout,
	diagrams: diagramsWordLayout,
	view: viewWordLayout,
	Formula: formulaWordBlockLayout,
	// "Img-v": imagesWordLayout,
	// "Img-h": imagesWordLayout,
	// See: seeWordLayout,
};

export const getExportedKeys = () => {
	return new Set<string>([
		...Object.keys(inlineLayouts),
		...Object.keys(blockLayouts),
		...Object.keys(tableLayout),
		"tab",
		undefined,
	]);
};

// export const exportedKeys = new Set<string>([
// 	...Object.keys(inlineLayouts),
// 	...Object.keys(blockLayouts),
// 	...Object.keys(tableLayout),
// 	"Tab",
// 	undefined,
// ]);
