import { getIconFromString } from "@ext/markdown/elements/icon/render/word/icon";
import { NON_BREAKING_SPACE, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import type { ImageRun } from "docx";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const cmdWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const icons: ImageRun[] = [];

	if (tag.attributes?.icon) icons.push(await getIconFromString(tag.attributes.icon));

	return [
		...icons,
		await createContent(NON_BREAKING_SPACE + tag.attributes.text + NON_BREAKING_SPACE, {
			...addOptions,
			style: WordFontStyles.button,
		}),
	];
};
