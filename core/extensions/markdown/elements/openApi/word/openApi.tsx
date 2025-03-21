import { ImageRun, Paragraph } from "docx";
import { createRoot } from "react-dom/client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";

export const openApiWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	const node = document.createElement("div");

	createRoot(node).render(
		<SwaggerUI
			defaultModelsExpandDepth={1}
			spec={(
				await WordImageExporter.getFileByPath(
					new Path(tag.attributes.src),
					wordRenderContext.parserContext.getResourceManager(),
				)
			).toString()}
		/>,
	);

	const innerHTML = node.innerHTML;
	node.remove();

	const size = ImageDimensionsFinder.getSvgDimensions(innerHTML, addOptions?.maxPictureWidth);
	return [
		new Paragraph({
			children: [
				new ImageRun({
					data: await BaseImageProcessor.svgToPng(innerHTML, size),
					transformation: {
						width: size.width,
						height: size.height,
					},
				}),
			],
		}),
	];
};
