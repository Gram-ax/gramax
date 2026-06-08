import DiagramType from "@core/components/Diagram/DiagramType";
import type { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import type { JSONContent } from "@tiptap/core";
import { mermaidHandler } from "../diagrams/mermaid/pdf/mermaid";
import { plantUmlHandler } from "../diagrams/plantUml/pdf/plantUml";

const DIAGRAMS_LAYOUTS = {
	[DiagramType.mermaid]: mermaidHandler,
	[DiagramType["plant-uml"]]: plantUmlHandler,
};

export const diagramsPdfLayout = async (node: JSONContent, context: pdfRenderContext, options?: NodeOptions) => {
	const layout = DIAGRAMS_LAYOUTS[node.attrs.diagramName as DiagramType];
	if (!layout) return;
	return await layout(node, context, options);
};
