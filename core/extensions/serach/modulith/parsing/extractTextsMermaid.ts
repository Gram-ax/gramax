import resolveBackendModule from "@app/resolveModule/backend";

export async function extractTextsMermaid(definition: string): Promise<string[]> {
	const src = definition.trim();
	if (!src) return [];

	return await resolveBackendModule("mermaidExtractText")(src);
}
