import { ExternalHyperlink, Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import t from "@ext/localization/locale/translate";
import { escapeLinkForPatcher } from "@ext/wordExport/utils/escapeLinkForPatcher";

export const videoWordLayout: WordBlockChild = async ({ tag }) => {
	const videoString = t("word.video");

	return await Promise.resolve([
		new Paragraph({
			children: [
				new ExternalHyperlink({
					children: [
						new TextRun({
							text: tag.attributes?.title ? `${videoString}: ` : `${videoString} `,
							style: WordFontStyles.link,
						}),
						new TextRun({
							text: tag.attributes?.title,
						}),
					],
					link: escapeLinkForPatcher(tag.attributes?.path),
				}),
			],
			style: WordFontStyles.videoTitle,
		}),
	]);
};
