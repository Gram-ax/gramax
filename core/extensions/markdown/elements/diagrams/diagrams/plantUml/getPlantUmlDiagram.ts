import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import parseError from "@ext/markdown/elements/diagrams/diagrams/plantUml/parseError";

const PlantUmlEncoder = import("plantuml-encoder");

async function getPlantUmlDiagram(diagramContent: string, diagramRendererUrl: string) {
	if (!diagramContent) throw new DefaultError(t("diagram.error.cannot-get-data"));

	const instanceUrl = diagramRendererUrl ? `${diagramRendererUrl}/plantuml` : "https://www.plantuml.com/plantuml";
	const url = `${instanceUrl}/svg/${(await PlantUmlEncoder).encode(diagramContent)}`;
	const diagramResponse = await fetch(url).catch(() => {
		throw new DefaultError(t("diagram.error.no-internet"));
	});

	if (diagramResponse.ok) return diagramResponse.text();

	if (diagramResponse.status === 400) {
		const errorText = parseError(await diagramResponse.text());
		const error = new Error(t("diagram.error.invalid-syntax"), { cause: errorText || "" });
		throw new DefaultError(error.message, error);
	}

	if (diagramResponse.status === 500) throw new DefaultError(t("diagram.error.invalid-syntax"));

	throw new DefaultError(t("app.error.something-went-wrong"));
}

export default getPlantUmlDiagram;
