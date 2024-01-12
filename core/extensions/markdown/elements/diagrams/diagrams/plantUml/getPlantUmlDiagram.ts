import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

const PlantUmlEncoder = import("plantuml-encoder");

async function getPlantUmlDiagram(diagramContent: string, apiUrlCreator?: ApiUrlCreator, src?: string) {
	const content = diagramContent ?? (await (await FetchService.fetch(apiUrlCreator.getArticleResource(src))).text());
	if (!content) throw Error("cantGetDiagramData");

	const url = `https://www.plantuml.com/plantuml/svg/${(await PlantUmlEncoder).encode(content)}`;
	const diagramResponse = await fetch(url).catch(() => {
		throw Error("checkInternetDiagramError");
	});

	if (!diagramResponse.ok) throw new Error("checkInternetOrSyntaxDiagramError");

	return await diagramResponse.text();
}

export default getPlantUmlDiagram;
