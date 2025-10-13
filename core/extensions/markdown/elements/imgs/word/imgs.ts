import docx from "@dynamicImports/docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";

export const imagesWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	const { Paragraph, TextRun } = await docx();
	const images = await Promise.all(
		(tag.attributes.images as string[]).map((image) =>
			WordImageExporter.getImageByPath(
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
