import { ExternalHyperlink, Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";

export const videoWordLayout: WordBlockChild = async ({ tag }) => {
	return await Promise.resolve([
		new Paragraph({
			children: [
				new ExternalHyperlink({
					children: [
						new TextRun({
							text: "Video: ",
							style: WordFontStyles.link,
						}),
						new TextRun({
							text: tag.attributes?.title,
						}),
					],
					link: tag.attributes?.path,
				}),
			],
			style: WordFontStyles.videoTitle,
		}),
	]);
};
