import DiagramType from "@core/components/Diagram/DiagramType";
import type { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { mermaidWordLayout } from "../diagrams/mermaid/word/mermaid";
import { plantUMLWordLayout } from "../diagrams/plantUml/word/plantUml";

const DIAGRAMS_LAYOUTS = {
	[DiagramType.mermaid]: mermaidWordLayout,
	[DiagramType["plant-uml"]]: plantUMLWordLayout,
};

export const diagramsWordLayout: WordBlockChild = async ({ tag, wordRenderContext, ...props }) => {
	const node = "attributes" in tag ? tag.attributes : tag.attrs;
	const layout = DIAGRAMS_LAYOUTS[node.diagramName as DiagramType];
	if (!layout) return [];
	return await layout({ ...props, tag, wordRenderContext });
};
