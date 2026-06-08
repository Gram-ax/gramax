import { requestPlantUmlDiagram } from "@ext/markdown/elements/diagrams/diagrams/plantUml/requestPlantUmlDiagram";

export const plantUmlToSvg = async (diagramContent: string, diagramRendererUrl?: string) => {
	if (!diagramRendererUrl) throw new Error("Diagram renderer URL is not set");
	const diagramResponse = await requestPlantUmlDiagram(diagramContent, diagramRendererUrl);
	if (diagramResponse.ok) return diagramResponse.text();

	const errorText = await diagramResponse.text().catch(() => "");
	throw new Error(
		`Failed to convert PlantUML to SVG. Status: ${diagramResponse.status}.${errorText ? ` Response: ${errorText}` : ""}`,
	);
};
