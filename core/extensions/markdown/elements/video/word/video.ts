import docx from "@dynamicImports/docx";
import t from "@ext/localization/locale/translate";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { escapeLinkForPatcher } from "@ext/wordExport/utils/escapeLinkForPatcher";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const videoWordLayout: WordBlockChild = async ({ tag }) => {
	const { ExternalHyperlink, Paragraph, TextRun } = await docx();
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
