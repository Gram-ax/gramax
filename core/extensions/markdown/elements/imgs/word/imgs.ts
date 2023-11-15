import { Paragraph, TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordBlockChild } from "../../../../wordExport/WordTypes";

export const imagesWordLayout: WordBlockChild = async ({ tag, resourceManager, fileProvider }) => {
	const images = await Promise.all(
		(tag.attributes.images as string[]).map((image) =>
			WordExportHelper.getImageByPath(
				new Path(image),
				resourceManager,
				fileProvider,
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
