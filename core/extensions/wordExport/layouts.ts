import { alfaWordLayout, betaWordLayout } from "@ext/markdown/elements/alfaBeta/word/alfabeta";
import { blockquoteWordLayout } from "@ext/markdown/elements/blockquote/word/blockquote";
import { brWordLayout } from "@ext/markdown/elements/br/word/br";
import { cmdWordLayout } from "@ext/markdown/elements/cmd/word/cmd";
import { codeWordLayout } from "@ext/markdown/elements/code/word/code";
import { fenceWordLayout } from "@ext/markdown/elements/codeBlockLowlight/word";
import { colorWordLayout } from "@ext/markdown/elements/color/word/color";
import { cutBlockWordLayout } from "@ext/markdown/elements/cut/word/cutBlock";
import { cutInlineWordLayout } from "@ext/markdown/elements/cut/word/cutInline";
import { mermaidWordLayout } from "@ext/markdown/elements/diagrams/diagrams/mermaid/word/mermaid";
import { drawioWordLayout } from "@ext/markdown/elements/drawio/word/drawio";
import { emWordLayout } from "@ext/markdown/elements/em/word/em";
import { headingWordLayout } from "@ext/markdown/elements/heading/word/heading";
import { hrWordLayout } from "@ext/markdown/elements/hr/word/hr";
import { includeWordLayout } from "@ext/markdown/elements/include/word/include";
import { issueWordLayout } from "@ext/markdown/elements/issue/word/issue";
import { kbdWordLayout } from "@ext/markdown/elements/kbd/word/kbd";
import { linkWordLayout } from "@ext/markdown/elements/link/word/link";
import { ulListWordLayout } from "@ext/markdown/elements/list/word/bulletList";
import { listItemWordLayout } from "@ext/markdown/elements/list/word/listItem";
import { orderListWordLayout } from "@ext/markdown/elements/list/word/orderListWordLayout";
import { moduleWordLayout } from "@ext/markdown/elements/module/word/module";
import { noteWordLayout } from "@ext/markdown/elements/note/word/note";
import { paragraphWordLayout } from "@ext/markdown/elements/paragraph/word/paragraph";
import { strongWordLayout } from "@ext/markdown/elements/strong/word/strong";
import { tableWordLayout } from "@ext/markdown/elements/table/word/table";
import { tabsWordLayout } from "@ext/markdown/elements/tabs/word/tabs";
import { termWordLayout } from "@ext/markdown/elements/term/word/term";
import { whoWordLayout, whenWordLayout } from "@ext/markdown/elements/whowhen/word/whoWhen";
import { plantUMLWordLayout } from "../markdown/elements/diagrams/diagrams/plantUml/word/plantUml";
import { diagramdbWordLayout } from "../markdown/elements/diagramdb/word/diagramdb";
import { c4DiagramWordLayout } from "../markdown/elements/diagrams/diagrams/c4Diagram/word/c4Diagram";
import { tsDiagramWordLayout } from "../markdown/elements/diagrams/diagrams/tsDiagram/word/tsDiagram";
import { snippetWordLayout } from "@ext/markdown/elements/snippet/word/snippet";
import { tabledbWordlayout } from "../markdown/elements/tabledb/word/tabledb";
import { videoWordLayout } from "../markdown/elements/video/word/video";
import { iconWordLayout } from "@ext/markdown/elements/icon/render/word/icon";
import { tableLayout } from "@ext/markdown/elements/table/word/transformer/getTableChilds";
import { strikeWordLayout } from "@ext/markdown/elements/strikethrough/word/strike";
import { renderImageWordLayout } from "@ext/markdown/elements/image/word/image";
// import { imagesWordLayout } from "@ext/markdown/elements/imgs/word/imgs";
// import { seeWordLayout } from "@ext/markdown/elements/see/word/see";
// import { formulaWordLayout } from "../markdown/elements/formula/word/formula";

export const inlineLayouts = {
	strong: strongWordLayout,
	em: emWordLayout,
	Link: linkWordLayout,
	Code: codeWordLayout,
	Br: brWordLayout,
	br: brWordLayout,
	Color: colorWordLayout,
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
	Icon: iconWordLayout,
	s: strikeWordLayout,
	//Formula: formulaWordLayout,
	//Fn
};

export const blockLayouts = {
	p: paragraphWordLayout,
	ol: orderListWordLayout,
	ul: ulListWordLayout,
	Li: listItemWordLayout,
	Heading: headingWordLayout,
	Table: tableWordLayout,
	Note: noteWordLayout,
	Fence: fenceWordLayout,
	Cut: cutBlockWordLayout,
	blockquote: blockquoteWordLayout,
	Include: includeWordLayout,
	Drawio: drawioWordLayout,
	Mermaid: mermaidWordLayout,
	hr: hrWordLayout,
	Tabs: tabsWordLayout,
	Snippet: snippetWordLayout,
	Video: videoWordLayout,
	Image: renderImageWordLayout,
	"Plant-uml": plantUMLWordLayout,
	"Db-diagram": diagramdbWordLayout,
	"Ts-diagram": tsDiagramWordLayout,
	"C4-diagram": c4DiagramWordLayout,
	"Db-table": tabledbWordlayout,
	// "Img-v": imagesWordLayout,
	// "Img-h": imagesWordLayout,
	// See: seeWordLayout,
	// OpenApi: openApiWordLayout,
};
export const exportedKeys = new Set<string>([
	...Object.keys(inlineLayouts),
	...Object.keys(blockLayouts),
	...Object.keys(tableLayout),
	"Tab",
	undefined,
]);
