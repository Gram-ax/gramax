import { ImageRun } from "docx";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const formulaWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const size = WordExportHelper.getSvgDimensions(tag.attributes.content, addOptions?.maxPictureWidth);
	const imageBlob = await WordExportHelper.svgToPngBlob(tag.attributes.content, size);
	const dimensions = await WordExportHelper.getImageSizeFromImageData(imageBlob);

	return [
		new ImageRun({
			data: await imageBlob.arrayBuffer(),
			transformation: {
				width: dimensions.width,
				height: dimensions.height,
			},
		}),
	];
};
