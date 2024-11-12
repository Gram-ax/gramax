import t from "@ext/localization/locale/translate";

const PlantUmlEncoder = import("plantuml-encoder");

async function getPlantUmlDiagram(diagramContent: string, diagramRendererUrl: string) {
	if (!diagramContent) throw Error(t("diagram.error.cannot-get-data"));

	const instanceUrl = diagramRendererUrl ? `${diagramRendererUrl}/plantuml` : "https://www.plantuml.com/plantuml";
	const url = `${instanceUrl}/svg/${(await PlantUmlEncoder).encode(diagramContent)}`;
	const diagramResponse = await fetch(url).catch(() => {
		throw Error(t("diagram.error.no-internet"));
	});

	if (diagramResponse.ok) return diagramResponse.text();

	if (diagramResponse.status === 500 || diagramResponse.status === 400)
		throw new Error(t("diagram.error.invalid-syntax"));

	throw new Error(t("app.error.something-went-wrong"));
}

export default getPlantUmlDiagram;
