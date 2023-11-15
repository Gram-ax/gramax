import { mermaidWordLayout } from "@ext/markdown/elements/diagrams/diagrams/mermaid/word/mermaidWordLayout";
import { cutBlockWordLayout } from "../markdown/elements/cut/word/cutBlock";
import { diagramdbWordLayout } from "../markdown/elements/diagramdb/word/diagramdb";
import { c4DiagramWordLayout } from "../markdown/elements/diagrams/diagrams/c4Diagram/word/c4Diagram";
import { plantUMLWordLayout } from "../markdown/elements/diagrams/diagrams/plantUml/word/plantUml";
import { tsDiagramWordLayout } from "../markdown/elements/diagrams/diagrams/tsDiagram/word/tsDiagram";
import { drawioWordLayout } from "../markdown/elements/drawio/word/drawio";
import { fenceWordLayout } from "../markdown/elements/fence/word/fence";
import { headingWordLayout } from "../markdown/elements/heading/word/heading";
import { imagesWordLayout } from "../markdown/elements/imgs/word/imgs";
import { includeWordLayout } from "../markdown/elements/include/word/include";
import { ulListWordLayout } from "../markdown/elements/list/word/bulletList";
import { listItemWordLayout } from "../markdown/elements/list/word/listItem";
import { orderListWordLayout } from "../markdown/elements/list/word/orderListWordLayout";
import { noteWordLayout } from "../markdown/elements/note/word/note";
import { paragraphWordLayout } from "../markdown/elements/paragraph/word/paragraph";
import { seeWordLayout } from "../markdown/elements/see/word/see";
import { tableWordLayout } from "../markdown/elements/table/word/table";
import { tabledbWordlayout } from "../markdown/elements/tabledb/word/tabledb";
import { videoWordLayout } from "../markdown/elements/video/word/video";
import { WordBlockChilds } from "./WordTypes";

export const getBlockChilds: () => WordBlockChilds = () => ({
	p: paragraphWordLayout,
	ol: orderListWordLayout,
	ul: ulListWordLayout,
	li: listItemWordLayout,
	Heading: headingWordLayout,
	Table: tableWordLayout,
	Note: noteWordLayout,
	Fence: fenceWordLayout,
	Cut: cutBlockWordLayout,
	See: seeWordLayout,
	Include: includeWordLayout,
	Video: videoWordLayout,
	"Img-v": imagesWordLayout,
	"Img-h": imagesWordLayout,
	Drawio: drawioWordLayout,
	"Db-table": tabledbWordlayout,
	"Ts-diagram": tsDiagramWordLayout,
	"Plant-uml": plantUMLWordLayout,
	"Db-diagram": diagramdbWordLayout,
	// OpenApi: openApiWordLayout,
	"C4-diagram": c4DiagramWordLayout,
	Mermaid: mermaidWordLayout,
});
