import { ImageRun, Paragraph } from "docx";
import { createRoot } from "react-dom/client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordImageProcessor } from "../../image/word/WordImageProcessor";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";

export const openApiWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	const node = document.createElement("div");

	createRoot(node).render(
		<SwaggerUI
			defaultModelsExpandDepth={1}
			spec={(
				await WordImageProcessor.getFileByPath(
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
					data: await WordImageProcessor.svgToPng(innerHTML, size),
					transformation: {
						width: size.width,
						height: size.height,
					},
				}),
			],
		}),
	];
};
