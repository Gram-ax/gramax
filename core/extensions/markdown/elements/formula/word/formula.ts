import { ImageRun } from "docx";
import { WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { WordImageProcessor } from "@ext/markdown/elements/image/word/WordImageProcessor";

export const formulaWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const size = ImageDimensionsFinder.getSvgDimensions(tag.attributes.content, addOptions?.maxPictureWidth);
	return [
		new ImageRun({
			data: await WordImageProcessor.svgToPng(tag.attributes.content, size),
			transformation: {
				width: size.width,
				height: size.height,
			},
		}),
	];
};
