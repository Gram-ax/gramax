import { Editor } from "@tiptap/core";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ArticleProps } from "../../../../../logic/SitePresenter/SitePresenter";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import Language from "../../../../localization/core/model/Language";

import initArticleResource from "../../../elementsUtils/AtricleResource/initArticleResource";
import { startC4DiagramText } from "../diagrams/c4Diagram/c4DiagramData";
import { startMermaid } from "../diagrams/mermaid/mermaidData";
import { startPlantUmlText } from "../diagrams/plantUml/plantUmlData";
import { startTsDiagram } from "../diagrams/tsDiagram/tsDiagramData";

const createDiagrams = async (
	editor: Editor,
	articleProps: ArticleProps,
	apiUrlCreator: ApiUrlCreator,
	lang: Language,
	diagramName: DiagramType,
) => {
	let file = "";
	let extension = "";
	switch (diagramName) {
		case DiagramType.mermaid:
			extension = "mermaid";
			file = startMermaid;
			break;
		case DiagramType["c4-diagram"]:
			extension = "dsl";
			file = startC4DiagramText;
			break;
		case DiagramType["plant-uml"]:
			extension = "puml";
			file = startPlantUmlText;
			break;
		case DiagramType["ts-diagram"]:
			extension = "ts";
			file = startTsDiagram;
			break;
	}

	const newName = await initArticleResource(editor, articleProps, apiUrlCreator, lang, file, extension);
	if (!newName) return;
	editor.chain().setDiagrams({ src: newName, diagramName }).run();
};

export default createDiagrams;
