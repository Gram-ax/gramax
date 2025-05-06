import { ContentStack, ContentTable } from "pdfmake/interfaces";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT, IMAGE_SCALE_FACTOR, MAX_WIDTH } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { pdfDiagramRenderer } from "@ext/markdown/elements/diagrams/pdf/pdfDiagramRenderer";
import DiagramType from "@core/components/Diagram/DiagramType";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { COLOR_CONFIG } from "@ext/pdfExport/config";

export async function mermaidHandler(
	node: Tag,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<ContentStack | ContentTable> {
	if (getExecutingEnvironment() === "next" || getExecutingEnvironment() === "cli") {
		return createTable(node, context);
	}

	return renderDiagram(node, context, options);
}

async function createTable(node: Tag, context: pdfRenderContext): Promise<ContentTable> {
	const textContent = await pdfDiagramRenderer.getDiagramContent(node, context.parserContext.getResourceManager());

	return {
		table: {
			dontBreakRows: true,
			widths: ["*"],
			body: [
				[
					{
						text: textContent,
						fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
						fillColor: COLOR_CONFIG.codeBlock.fillColor,
						margin: [
							BASE_CONFIG.FONT_SIZE * 1.25,
							BASE_CONFIG.FONT_SIZE * 1.25,
							BASE_CONFIG.FONT_SIZE * 1.25,
							BASE_CONFIG.FONT_SIZE * 1.25 - BASE_CONFIG.LINE_HEIGHT_MARGIN,
						],
						lineHeight: 1.2,
						font: "Menlo",
						color: COLOR_CONFIG.codeBlock.textColor,
						preserveLeadingSpaces: true,
					},
				],
			],
		},
		layout: "noBorders",
	};
}

async function renderDiagram(node: Tag, context: pdfRenderContext, options?: NodeOptions): Promise<ContentStack> {
	let originalWidth = parseInt(node.attributes.width) || MAX_WIDTH;

	if (options?.colWidth) {
		originalWidth = Math.min(originalWidth, options.colWidth);
	}

	const { base64, size } = await pdfDiagramRenderer.renderSimpleDiagram(
		node,
		DiagramType["mermaid"],
		context.parserContext.getResourceManager(),
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
