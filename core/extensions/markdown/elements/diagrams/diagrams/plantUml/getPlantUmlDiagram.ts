import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import PlantUmlEncoder from "plantuml-encoder";

async function getPlantUmlDiagram(diagramContent: string, apiUrlCreator?: ApiUrlCreator, src?: string) {
	const content = diagramContent ?? (await (await FetchService.fetch(apiUrlCreator.getArticleResource(src))).text());
	const url = `https://www.plantuml.com/plantuml/svg/${PlantUmlEncoder.encode(content)}`;
	return await (await fetch(url)).text();
}

export default getPlantUmlDiagram;
