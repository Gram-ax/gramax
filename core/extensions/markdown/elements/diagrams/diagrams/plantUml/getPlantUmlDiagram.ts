const PlantUmlEncoder = import("plantuml-encoder");

async function getPlantUmlDiagram(diagramContent: string) {
	if (!diagramContent) throw Error("cantGetDiagramData");

	const url = `https://www.plantuml.com/plantuml/svg/${(await PlantUmlEncoder).encode(diagramContent)}`;
	const diagramResponse = await fetch(url).catch(() => {
		throw Error("checkInternetDiagramError");
	});

	if (!diagramResponse.ok) throw new Error("checkInternetOrSyntaxDiagramError");

	return diagramResponse.text();
}

export default getPlantUmlDiagram;
