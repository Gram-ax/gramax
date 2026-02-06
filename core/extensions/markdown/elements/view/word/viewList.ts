import docx from "@dynamicImports/docx";
import t from "@ext/localization/locale/translate";
import { extractNameAndAnchor } from "@ext/markdown/elements/link/word/link";
import type { ViewRenderGroup } from "@ext/properties/models";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { getMmToTw } from "@ext/wordExport/lists/consts";
import type { TitleInfo } from "@ext/wordExport/options/WordTypes";
import { getBulletSymbol } from "@ext/wordExport/options/wordDocumentStyles";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import type { Paragraph } from "docx";

export const viewList = async (data: ViewRenderGroup[], titlesMap: Map<string, TitleInfo>) => {
	const results = await Promise.all(data.map((group) => processGroup(group, titlesMap)));
	return results.flat();
};

const processGroup = async (group: ViewRenderGroup, titlesMap: Map<string, TitleInfo>, level: number = 0) => {
	const { Paragraph, TextRun, InternalHyperlink } = await docx();
	const mmToTw = await getMmToTw();

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
						left: mmToTw(5 * level),
					},
					style: "ListParagraph",
				}),
			);
		}
	}

	if (group.articles?.length > 0) {
		for (const article of group.articles) {
			const { text, font } = getBulletSymbol(level);
			const { title, order, anchor } = extractNameAndAnchor({ href: article.linkPath, hash: "" }, titlesMap);
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
						left: mmToTw(5 + 5 * level),
						hanging: mmToTw(5),
					},
					style: "ListParagraph",
				}),
			);
		}
	}

	if (group.subgroups?.length > 0) {
		for (const subgroup of group.subgroups) {
			items.push(...(await processGroup(subgroup, titlesMap, level + 1)));
		}
	}

	return items;
};

const getGroupTitle = (group: ViewRenderGroup): string[] => {
	if (!group.group) {
		return [t("properties.empty")];
	}
	return group.group.map((g: string | null) => (g === null ? t("properties.empty") : g));
};
