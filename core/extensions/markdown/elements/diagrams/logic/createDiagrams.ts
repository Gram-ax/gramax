import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Editor } from "@tiptap/core";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import { startC4DiagramText } from "../diagrams/c4Diagram/c4DiagramData";
import { startMermaid } from "../diagrams/mermaid/mermaidData";
import { startPlantUmlText } from "../diagrams/plantUml/plantUmlData";
import { startTsDiagram } from "../diagrams/tsDiagram/tsDiagramData";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
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
	fileName: string,
	apiUrlCreator: ApiUrlCreator,
	resourceService: ResourceServiceType,
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

	const name = `${fileName}.${extension}`;
	const newName = await resourceService.setResource(name, file);

	if (!newName) return;

	const attributes: { src: string; diagramName: string; width?: string; height?: string } = {
		src: newName,
		diagramName,
	};
	try {
		const diagramData = DIAGRAM_FUNCTIONS?.[diagramName]
			? await DIAGRAM_FUNCTIONS?.[diagramName](file, pageDataContext.conf.diagramsServiceUrl)
			: await getAnyDiagrams(file, apiUrlCreator, diagramName, diagramName === DiagramType["c4-diagram"]);
		const newSize = getNaturalSize(diagramData);

		if (newSize) {
			attributes.width = newSize.width + "px";
			attributes.height = newSize.height + "px";
		}
	} catch (error) {
		console.error("Error creating diagram:", error);
	}

	editor.chain().setDiagrams(attributes).run();
};

export default createDiagrams;
