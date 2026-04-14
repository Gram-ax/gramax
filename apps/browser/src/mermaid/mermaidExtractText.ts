import { extractTextsSvg } from "@ext/serach/modulith/parsing/extractTextsSvg";

let initialized = false;

export async function mermaidExtractText(definition: string): Promise<string[]> {
	const mermaid = await import("mermaid");
	if (!initialized) {
		mermaid.default.initialize({ startOnLoad: false });
		initialized = true;
	}

	const diagramId = `modulith-mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	const { svg } = await mermaid.default.render(diagramId, definition);
	return extractTextsSvg(svg);
}
