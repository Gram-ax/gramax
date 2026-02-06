import DiagramType from "@core/components/Diagram/DiagramType";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { pdfDiagramRenderer } from "@ext/markdown/elements/diagrams/pdf/pdfDiagramRenderer";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT, IMAGE_SCALE_FACTOR, MAX_WIDTH } from "@ext/pdfExport/config";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { ContentStack } from "pdfmake/interfaces";

export async function plantUmlHandler(
	node: Tag,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<ContentStack> {
	let originalWidth = parseInt(node.attributes.width) || MAX_WIDTH;

	if (options?.colWidth) {
		originalWidth = Math.min(originalWidth, options.colWidth);
	}

	const { base64, size } = await pdfDiagramRenderer.renderSimpleDiagram(
		node,
		DiagramType["plant-uml"],
		context.resourceManager,
		originalWidth,
	);

	return {
		stack: [
			{
				image: base64,
				width: size.width * IMAGE_SCALE_FACTOR,
				margin: [0, 0, 0, BASE_CONFIG.FONT_SIZE * 0.5],
			},
			{
				text: node.attributes.title || "",
				margin: [0, -BASE_CONFIG.FONT_SIZE * 0.25, 0, BASE_CONFIG.FONT_SIZE * 0.5],
				fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
				italics: true,
			},
		],
		alignment: "center",
	};
}
