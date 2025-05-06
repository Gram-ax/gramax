import { alfaHandler, betaHandler } from "@ext/markdown/elements/alfaBeta/pdf/alfabeta";
import { brHandler } from "@ext/markdown/elements/br/pdf/br";
import { cmdHandler } from "@ext/markdown/elements/cmd/pdf/cmd";
import { codeHandler } from "@ext/markdown/elements/code/pdf/code";
import { codeBlockHandler } from "@ext/markdown/elements/codeBlockLowlight/pdf/code";
import { colorHandler } from "@ext/markdown/elements/color/pdf/color";
import { cutInlineHandler } from "@ext/markdown/elements/cut/pdf/cutInline";
import { diagramdbHandler } from "@ext/markdown/elements/diagramdb/pdf/diagramdb";
import { mermaidHandler } from "@ext/markdown/elements/diagrams/diagrams/mermaid/pdf/mermaid";
import { plantUmlHandler } from "@ext/markdown/elements/diagrams/diagrams/plantUml/pdf/plantUml";
import { drawioHandler } from "@ext/markdown/elements/drawio/pdf/drawio";
import { emHandler } from "@ext/markdown/elements/em/pdf/em";
import { headingHandler } from "@ext/markdown/elements/heading/pdf/heading";
import { hrHandler } from "@ext/markdown/elements/hr/pdf/hr";
import { imageHandler } from "@ext/markdown/elements/image/pdf/image";
import { includeHandler } from "@ext/markdown/elements/include/pdf/include";
import { inlinePropertyHandler } from "@ext/markdown/elements/inlineProperty/pdf/inlineProperty";
import { issueHandler } from "@ext/markdown/elements/issue/pdf/issue";
import { kbdHandler } from "@ext/markdown/elements/kbd/pdf/kbd";
import { linkHandler } from "@ext/markdown/elements/link/pdf/link";
import { bulletListHandler } from "@ext/markdown/elements/list/pdf/bulletList";
import { listItemHandler } from "@ext/markdown/elements/list/pdf/listItem";
import { orderedListHandler } from "@ext/markdown/elements/list/pdf/orderedList";
import { moduleHandler } from "@ext/markdown/elements/module/pdf/module";
import { noteHandler } from "@ext/markdown/elements/note/pdf/note";
import { paragraphCase } from "@ext/markdown/elements/paragraph/pdf/paragraph";
import { snippetCase } from "@ext/markdown/elements/snippet/pdf/snippet";
import { strikeHandler } from "@ext/markdown/elements/strikethrough/pdf/strike";
import { strongHandler } from "@ext/markdown/elements/strong/pdf/storng";
import { tableCase } from "@ext/markdown/elements/table/pdf/table";
import { tabledbHandler } from "@ext/markdown/elements/tabledb/pdf/tabledb";
import { tabsHandler } from "@ext/markdown/elements/tabs/pdf/tabs";
import { termHandler } from "@ext/markdown/elements/term/pdf/term";
import { videoHandler } from "@ext/markdown/elements/video/pdf/video";
import { viewCase } from "@ext/markdown/elements/view/pdf/view";
import { whoHandler } from "@ext/markdown/elements/whowhen/pdf/whoWhen";

export const inlineLayouts = {
	strong: strongHandler,
	em: emHandler,
	Link: linkHandler,
	Code: codeHandler,
	Color: colorHandler,
	Alfa: alfaHandler,
	Beta: betaHandler,
	Who: whoHandler,
	When: whoHandler,
	Issue: issueHandler,
	Kbd: kbdHandler,
	Cmd: cmdHandler,
	Module: moduleHandler,
	Cut: cutInlineHandler,
	Term: termHandler,
	s: strikeHandler,
	Br: brHandler,
	br: brHandler,
	"Inline-property": inlinePropertyHandler,
	// Icon,
	//Formula,
	//Fn
};

export const blockLayouts = {
	p: paragraphCase,
	orderedList: orderedListHandler,
	bulletList: bulletListHandler,
	listItem: listItemHandler,
	Heading: headingHandler,
	note: noteHandler,
	Fence: codeBlockHandler,
	hr: hrHandler,
	Video: videoHandler,
	Image: imageHandler,
	Drawio: drawioHandler,
	"Plant-uml": plantUmlHandler,
	Mermaid: mermaidHandler,
	Include: includeHandler,
	tabs: tabsHandler,
	tab: tabsHandler,
	Table: tableCase,
	snippet: snippetCase,
	"Db-diagram": diagramdbHandler,
	"Db-table": tabledbHandler,
	View: viewCase,
	// cut
	// blockquote
	// 	"Ts-diagram": tsDiagramWordLayout,
	// "C4-diagram": c4DiagramWordLayout,
	// 	// "Img-v": imagesWordLayout,
	// 	// "Img-h": imagesWordLayout,
	// 	// See: seeWordLayout,
	// OpenApi: openApiWordLayout,
};

export const tableLayoutKeys = ["thead", "tbody", "td", "tr", "th"];

export const getPdfExportedKeys = () => {
	return new Set<string>([
		...Object.keys(inlineLayouts),
		...Object.keys(blockLayouts),
		...tableLayoutKeys,
		"tab",
		undefined,
	]);
};
