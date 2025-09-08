import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { WordFontStyles, NON_BREAKING_SPACE } from "@ext/wordExport/options/wordExportSettings";
import { ImageRun } from "docx";
import { getIconFromString } from "@ext/markdown/elements/icon/render/word/icon";

export const cmdWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const icons: ImageRun[] = [];

	if (tag.attributes?.icon) icons.push(await getIconFromString(tag.attributes.icon));

	return [
		...icons,
		createContent(NON_BREAKING_SPACE + tag.attributes.text + NON_BREAKING_SPACE, {
			...addOptions,
			style: WordFontStyles.button,
		}),
	];
};
