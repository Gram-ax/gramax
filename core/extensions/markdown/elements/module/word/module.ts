import { getIconFromString } from "@ext/markdown/elements/icon/render/word/icon";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";

export const moduleWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	return [
		await getIconFromString("box"),
		await createContent(`${tag.attributes.id}`, { ...addOptions, style: WordFontStyles.module }),
	];
};
