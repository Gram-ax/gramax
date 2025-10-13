import docx from "@dynamicImports/docx";
import { WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";

export const formulaWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const { ImageRun } = await docx();
	const size = ImageDimensionsFinder.getSvgDimensions(tag.attributes.content, addOptions?.maxPictureWidth);
	return [
		new ImageRun({
			data: await BaseImageProcessor.svgToPng(tag.attributes.content, size),
			transformation: {
				width: size.width,
				height: size.height,
			},
		}),
	];
};
