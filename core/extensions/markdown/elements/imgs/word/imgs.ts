import docx from "@dynamicImports/docx";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import Path from "../../../../../logic/FileProvider/Path/Path";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const imagesWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	const { Paragraph, TextRun } = await docx();
	const images = await Promise.all(
		(tag.attributes.images as string[]).map((image) =>
			WordImageExporter.getImageByPath(
				new Path(image),
				wordRenderContext.resourceManager,
				tag.attributes.postfix === "h" ? 600 / tag.attributes.images.length : undefined,
			),
		),
	);
	const lineBreak = tag.attributes.postfix === "v" ? [new TextRun({ text: "", break: 1 })] : [];

	return [
		new Paragraph({
			children: images.flatMap((image) => [image, ...lineBreak]),
		}),
	];
};
