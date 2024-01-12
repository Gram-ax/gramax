import { ImageRun, Paragraph } from "docx";
import { render } from "react-dom";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordBlockChild } from "../../../../wordExport/WordTypes";

export const openApiWordLayout: WordBlockChild = async ({ tag, resourceManager }) => {
	const spec = (await WordExportHelper.getFileByPath(new Path(tag.attributes.src), resourceManager)).toString();

	const component = <SwaggerUI defaultModelsExpandDepth={1} spec={spec} />;
	const node = document.createElement("div");
	render(component, node);
	const innerHTML = node.innerHTML;
	node.remove();
	const diagramImage = await WordExportHelper.getImageFromDom(innerHTML, false);

	const dimensions = await WordExportHelper.getImageSizeFromImageData(diagramImage);

	return [
		new Paragraph({
			children: [
				new ImageRun({
					data: await diagramImage.arrayBuffer(),
					transformation: {
						height: dimensions.height,
						width: dimensions.width,
					},
				}),
			],
		}),
	];
};
