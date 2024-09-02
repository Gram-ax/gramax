import { ImageRun, Paragraph } from "docx";
import { createRoot } from "react-dom/client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const openApiWordLayout: WordBlockChild = async ({ tag, addOptions, resourceManager }) => {
	const spec = (await WordExportHelper.getFileByPath(new Path(tag.attributes.src), resourceManager)).toString();

	const component = <SwaggerUI defaultModelsExpandDepth={1} spec={spec} />;
	const node = document.createElement("div");
	const root = createRoot(node);
	root.render(component);
	const innerHTML = node.innerHTML;
	node.remove();
	const size = WordExportHelper.getSvgDimensions(innerHTML, addOptions?.maxPictureWidth);
	const diagramImage = await WordExportHelper.svgToPngBlob(innerHTML, size);

	return [
		new Paragraph({
			children: [
				new ImageRun({
					data: await diagramImage.arrayBuffer(),
					transformation: {
						width: size.width,
						height: size.height,
					},
				}),
			],
		}),
	];
};
