import { ContentStack } from "pdfmake/interfaces";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT, MAX_WIDTH } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import DbDiagram from "@core-ui/DbDiagram";
import Path from "@core/FileProvider/Path/Path";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import { PDFImageExporter } from "@ext/markdown/elements/image/pdf/PdfImageProcessor";

export async function diagramdbHandler(
	node: Tag,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<ContentStack> {
	let originalWidth = parseInt(node.attributes.width) || MAX_WIDTH;

	if (options?.colWidth) {
		originalWidth = Math.min(originalWidth, options.colWidth);
	}

	originalWidth = Math.min(originalWidth, MAX_WIDTH);

	const diagram = new DbDiagram(context.parserContext.getTablesManager(), context.parserContext.fp);
    const path = context.parserContext.getResourceManager().getAbsolutePath(new Path(node.attributes.src));
	const diagramRef = context.parserContext.fp.getItemRef(path);
	await diagram.addDiagram(
		diagramRef,
		node.attributes.tags,
		defaultLanguage,
		context.parserContext.getResourceManager().rootPath,
	);

	const { base64, size } = await PDFImageExporter.getImageFromDiagramString(diagram.draw(), false, originalWidth);

	return {
		stack: [
			{
				image: base64,
				width: size.width,
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
