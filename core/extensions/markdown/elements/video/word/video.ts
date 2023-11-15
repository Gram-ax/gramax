import { ExternalHyperlink, Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";

export const videoWordLayout: WordBlockChild = async ({ tag }) => {
	return await Promise.resolve([
		new Paragraph({
			children: [
				new ExternalHyperlink({
					children: [
						new TextRun({
							text: tag.attributes.title,
							style: "Hyperlink",
						}),
					],
					link: tag.attributes.path,
				}),
			],
		}),
	]);
};
