export async function requestPlantUmlDiagram(diagramContent: string, diagramRendererUrl: string) {
	return await fetch(`${diagramRendererUrl}/convert/plantuml`, {
		method: "POST",
		body: JSON.stringify({ content: diagramContent }),
		headers: { "Content-Type": "application/json" },
	});
}
