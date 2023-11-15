import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import mermaid from "mermaid";

let diagramCounter = 0;

const getMermaidDiagram = async (diagramContent: string, apiUrlCreator?: ApiUrlCreator, src?: string) => {
	const diagramData =
		diagramContent ?? (await (await FetchService.fetch(apiUrlCreator.getArticleResource(src))).text());
	if (!diagramData) return "";

	const diagramId = `mermaid-diagram-${diagramCounter++}`;
	const diagramRenderElement = document.createElement(`pre`);
	diagramRenderElement.id = diagramId;
	const result = (await mermaid.render(diagramId, diagramData)).svg;

	diagramRenderElement.remove();
	return result;
};

export default getMermaidDiagram;
