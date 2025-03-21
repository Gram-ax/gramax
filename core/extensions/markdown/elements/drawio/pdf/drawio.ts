import { ContentStack, ContentTable } from "pdfmake/interfaces";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT, IMAGE_SCALE_FACTOR, MAX_WIDTH } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import Path from "@core/FileProvider/Path/Path";
import { PDFImageExporter } from "@ext/markdown/elements/image/pdf/PdfImageProcessor";

export async function drawioHandler(
	node: Tag,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<ContentStack | ContentTable> {
	let originalWidth = parseInt(node.attributes.width) * IMAGE_SCALE_FACTOR || MAX_WIDTH;

	if (options?.colWidth) {
		originalWidth = Math.min(originalWidth, options.colWidth * IMAGE_SCALE_FACTOR);
	}
	originalWidth = Math.min(originalWidth, MAX_WIDTH);

	const { base64, size } = await PDFImageExporter.getImageFromSvgPath(
		new Path(node.attributes.src),
		context.parserContext.getResourceManager(),
		originalWidth,
	);

	return {
		stack: [
			{
				image: base64,
				width: size.width,
				margin: [0, 0, 0, BASE_CONFIG.FONT_SIZE * 0.5],
			},
			{
				text: node.attributes.title || "",
				margin: [0, -BASE_CONFIG.FONT_SIZE * 0.25, 0, 0],
				fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
				italics: true,
			},
		],
		alignment: "center",
	};
}
