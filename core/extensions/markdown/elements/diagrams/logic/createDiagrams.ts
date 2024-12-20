import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Editor } from "@tiptap/core";
import { ClientArticleProps } from "../../../../../logic/SitePresenter/SitePresenter";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";

import initArticleResource from "../../../elementsUtils/AtricleResource/initArticleResource";
import { startC4DiagramText } from "../diagrams/c4Diagram/c4DiagramData";
import { startMermaid } from "../diagrams/mermaid/mermaidData";
import { startPlantUmlText } from "../diagrams/plantUml/plantUmlData";
import { startTsDiagram } from "../diagrams/tsDiagram/tsDiagramData";
import { OnLoadResource } from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";
import PageDataContext from "@core/Context/PageDataContext";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import FetchService from "@core-ui/ApiServices/FetchService";

const DIAGRAM_FUNCTIONS = {
	[DiagramType.mermaid]: getMermaidDiagram,
	[DiagramType["plant-uml"]]: getPlantUmlDiagram,
};

const getAnyDiagrams = async (
	content: string,
	apiUrlCreator: ApiUrlCreator,
	diagramName: DiagramType,
	isC4Diagram: boolean,
) => {
	const res = await FetchService.fetch(apiUrlCreator.getDiagramByContentUrl(diagramName), content);
	if (!res.ok) return;
	return isC4Diagram ? await res.json() : await res.text();
};

const createDiagrams = async (
	editor: Editor,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
	onLoadResource: OnLoadResource,
	diagramName: DiagramType,
	pageDataContext: PageDataContext,
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

	const newName = await initArticleResource(articleProps, apiUrlCreator, onLoadResource, file, extension);
	if (!newName) return;
	const diagramData = DIAGRAM_FUNCTIONS?.[diagramName]
		? await DIAGRAM_FUNCTIONS?.[diagramName](file, pageDataContext.conf.diagramsServiceUrl)
		: await getAnyDiagrams(file, apiUrlCreator, diagramName, diagramName === DiagramType["c4-diagram"]);
	const newSize = getNaturalSize(diagramData);
	const attributes: { src: string; diagramName: string; width?: string; height?: string } = {
		src: newName,
		diagramName,
	};
	if (newSize) {
		attributes.width = newSize.width + "px";
		attributes.height = newSize.height + "px";
	}

	editor.chain().setDiagrams(attributes).run();
};

export default createDiagrams;
