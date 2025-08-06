import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";

const getMermaidDiagram = async (diagramContent: string) => {
	const mermaid = await import("mermaid");
	if (!diagramContent) throw new DefaultError(t("diagram.error.cannot-get-data"));

	const diagramId = `mermaidGraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const diagramRenderContainer = document.createElement("div");
	document.body.appendChild(diagramRenderContainer);

	try {
		const { svg } = await mermaid.default.render(diagramId, diagramContent, diagramRenderContainer);
		return svg;
	} catch (error) {
		console.error("Mermaid diagram render error: ", error);

		if (
			error.message.includes("error loading dynamically imported module") ||
			error.message.includes("Failed to fetch dynamically imported module")
		)
			throw new DefaultError(t("diagram.error.no-internet"));

		error.cause = error.message;
		throw new DefaultError(t("diagram.error.invalid-syntax"), error);
	} finally {
		diagramRenderContainer.remove();
	}
};

export default getMermaidDiagram;
