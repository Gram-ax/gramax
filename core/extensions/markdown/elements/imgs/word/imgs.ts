import { Paragraph, TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordImageProcessor } from "../../image/word/WordImageProcessor";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const imagesWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	const images = await Promise.all(
		(tag.attributes.images as string[]).map((image) =>
			WordImageProcessor.getImageByPath(
				new Path(image),
				wordRenderContext.parserContext.getResourceManager(),
				tag.attributes.postfix === "h" ? 600 / tag.attributes.images.length : undefined,
			),
		),
	);
	const lineBreak = tag.attributes.postfix === "v" ? [new TextRun({ text: "", break: 1 })] : [];

	return [
		new Paragraph({
			children: images.map((image) => [image, ...lineBreak]).flat(),
		}),
	];
};
