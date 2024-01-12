import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

const mermaid = import("mermaid");

let diagramCounter = 0;

const getMermaidDiagram = async (diagramContent: string, apiUrlCreator?: ApiUrlCreator, src?: string) => {
	const diagramData =
		diagramContent ?? (await (await FetchService.fetch(apiUrlCreator.getArticleResource(src))).text());
	if (!diagramData) throw Error("cantGetDiagramData");

	const diagramId = `mermaid-diagram-${diagramCounter++}`;
	const diagramRenderElement = document.createElement(`pre`);
	diagramRenderElement.id = diagramId;
	const result = (
		await mermaid
			.catch(() => {
				throw Error("checkInternetDiagramError");
			})
			.then((mermaid) => mermaid.default.render(diagramId, diagramData))
			.catch(() => {
				throw Error("checkInternetOrSyntaxDiagramError");
			})
	).svg;

	diagramRenderElement.remove();
	return result;
};

export default getMermaidDiagram;
