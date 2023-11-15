import { ImageRun } from "docx";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const formulaWordLayout: WordInlineChild = async ({ tag }) => {
	const imageBlob = await WordExportHelper.getImageFromDom(tag.attributes.content);

	const dimensions = await WordExportHelper.getImageSizeFromImageData(imageBlob);

	return [
		new ImageRun({
			data: await imageBlob.arrayBuffer(),
			transformation: {
				height: dimensions.height,
				width: dimensions.width,
			},
		}),
	];
};
