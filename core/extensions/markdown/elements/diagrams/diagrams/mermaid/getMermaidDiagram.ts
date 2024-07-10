import mermaid from "mermaid";

let diagramCounter = 0;

const getMermaidDiagram = async (diagramContent) => {
	if (!diagramContent) throw new Error("cantGetDiagramData");

	const diagramId = `mermaid-diagram-${diagramCounter++}`;
	const diagramRenderContainer = document.createElement("div");
	document.body.appendChild(diagramRenderContainer);

	try {
		const { svg } = await mermaid.render(diagramId, diagramContent, diagramRenderContainer);
		return svg;
	} catch (error) {
		if (error.message.includes("Parse error"))
			throw new Error("checkSyntaxDiagramError");

		throw new Error("checkInternetDiagramError");
	}
	finally {
		diagramRenderContainer.remove();
	}
};

export default getMermaidDiagram;
