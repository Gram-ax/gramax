import { Paragraph, TextRun } from "docx";
import { getBulletSymbol } from "@ext/wordExport/options/wordDocumentStyles";
import { InternalHyperlink } from "docx";
import { extractNameAndAnchor } from "@ext/markdown/elements/link/word/link";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { convertMillimetersToTwip } from "docx";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import { ViewRenderGroup } from "@ext/properties/models";
import t from "@ext/localization/locale/translate";

export const viewList = (data: ViewRenderGroup[], titlesMap: Map<string, TitleInfo>) => {
	return data.flatMap((group) => processGroup(group, titlesMap));
};

const processGroup = (group: ViewRenderGroup, titlesMap: Map<string, TitleInfo>, level: number = 0) => {
	const items: Paragraph[] = [];

	if (group.group && group.group.length > 0) {
		const groupTitle = getGroupTitle(group);
		if (groupTitle.length > 0) {
			const { text: bulletText, font } = getBulletSymbol(level);

			items.push(
				new Paragraph({
					children: [
						new TextRun({
							text: bulletText,
							font: font,
						}),
						new TextRun({
							text: "   " + groupTitle.join(""),
						}),
					],
					indent: {
						left: convertMillimetersToTwip(5 * level),
					},
					style: "ListParagraph",
				}),
			);
		}
	}

	if (group.articles?.length > 0) {
		group.articles.forEach((article) => {
			const { text, font } = getBulletSymbol(level);
			const { title, order, anchor } = extractNameAndAnchor(article.linkPath, titlesMap);
			const safeTitle = article.title || t("article.no-name");

			items.push(
				new Paragraph({
					children: [
						new TextRun({
							text: text,
							font: font,
						}),
						new TextRun({
							text: "   ",
							size: 24,
						}),
						title
							? new InternalHyperlink({
									anchor: generateBookmarkName(order, title, anchor),
									children: [
										new TextRun({
											text: safeTitle,
											size: 24,
											style: WordFontStyles.link,
										}),
									],
							  })
							: new TextRun({ text: safeTitle, size: 24 }),
					],
					indent: {
						left: convertMillimetersToTwip(5 + 5 * level),
						hanging: convertMillimetersToTwip(5),
					},
					style: "ListParagraph",
				}),
			);
		});
	}

	if (group.subgroups?.length > 0) {
		group.subgroups.forEach((subgroup) => {
			items.push(...processGroup(subgroup, titlesMap, level + 1));
		});
	}

	return items;
};

const getGroupTitle = (group: ViewRenderGroup): string[] => {
	if (!group.group) {
		return [t("properties.empty")];
	}
	return group.group.map((g: string | null) => (g === null ? t("properties.empty") : g));
};
