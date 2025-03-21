import { ContentStack, ContentTable } from "pdfmake/interfaces";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT, IMAGE_SCALE_FACTOR, MAX_HEIGTH, MAX_WIDTH } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import Path from "@core/FileProvider/Path/Path";
import { PDFImageExporter } from "@ext/markdown/elements/image/pdf/PdfImageProcessor";

export async function imageHandler(
	node: Tag,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<ContentStack | ContentTable> {
	const originalWidth = parseInt(node.attributes.width) || MAX_WIDTH;

	const { base64, size } = await PDFImageExporter.getImageByPath(
		new Path(node.attributes.src),
		context.parserContext.getResourceManager(),
		originalWidth,
		MAX_HEIGTH,
		node.attributes?.crop,
		node.attributes?.objects,
		node.attributes?.scale,
	);

	const annotationTexts = node?.attributes?.objects
		.map((annotation, index) => {
			if (annotation.text) {
				return `${index + 1}. ${annotation.text}`;
			}
			return null;
		})
		.filter((text) => text !== null)
		.join(" ");

	return {
		stack: [
			{
				image: base64,
				width: Math.min(size.width * IMAGE_SCALE_FACTOR, options?.colWidth || MAX_WIDTH),
				margin: [0, 0, 0, BASE_CONFIG.FONT_SIZE * 0.5],
			},
			{
				text: node.attributes.title || "",
				margin: [0, -BASE_CONFIG.FONT_SIZE * 0.25, 0, BASE_CONFIG.FONT_SIZE * 0.25],
				lineHeight: BASE_CONFIG.LINE_HEIGHT,
				fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
				italics: true,
			},
			{
				text: annotationTexts || "",
				lineHeight: BASE_CONFIG.LINE_HEIGHT,
				fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
				italics: true,
			},
		],
		alignment: "center",
	};
}
