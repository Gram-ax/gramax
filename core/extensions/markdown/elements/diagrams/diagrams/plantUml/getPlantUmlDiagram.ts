import t from "@ext/localization/locale/translate";
import parseError from "@ext/markdown/elements/diagrams/diagrams/plantUml/parseError";

const PlantUmlEncoder = import("plantuml-encoder");

async function getPlantUmlDiagram(diagramContent: string, diagramRendererUrl: string) {
	if (!diagramContent) throw Error(t("diagram.error.cannot-get-data"));

	const instanceUrl = diagramRendererUrl ? `${diagramRendererUrl}/plantuml` : "https://www.plantuml.com/plantuml";
	const url = `${instanceUrl}/svg/${(await PlantUmlEncoder).encode(diagramContent)}`;
	const diagramResponse = await fetch(url).catch(() => {
		throw Error(t("diagram.error.no-internet"));
	});

	if (diagramResponse.ok) return diagramResponse.text();

	if (diagramResponse.status === 400) {
		const errorText = parseError(await diagramResponse.text());
		throw new Error(t("diagram.error.invalid-syntax"), { cause: errorText || "" });
	}

	if (diagramResponse.status === 500) throw new Error(t("diagram.error.invalid-syntax"));

	throw new Error(t("app.error.something-went-wrong"));
}

export default getPlantUmlDiagram;
