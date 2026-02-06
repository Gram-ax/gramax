import Path from "@core/FileProvider/Path/Path";
import { PDFImageExporter } from "@ext/markdown/elements/image/pdf/PdfImageProcessor";
import { MAX_HEIGTH, MAX_WIDTH } from "@ext/pdfExport/config";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { JSONContent } from "@tiptap/core";
import { ContentImage } from "pdfmake/interfaces";

export async function inlineImageHandler(
	node: JSONContent,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<ContentImage> {
	const originalWidth = parseInt(node.attrs.width) || MAX_WIDTH;

	const { base64, size } = await PDFImageExporter.getImageByPath(
		new Path(node.attrs.src),
		context.resourceManager,
		originalWidth,
		MAX_HEIGTH,
	);

	return {
		image: base64,
		width: Math.min(size.width, options?.colWidth || MAX_WIDTH),
	};
}
