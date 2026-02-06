import type UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { NON_BREAKING_SPACE, WordFontStyles } from "./options/wordExportSettings";

export const errorWordLayout = async (objectType: string, language: UiLanguage) => {
	return Promise.resolve([
		await createParagraph([
			await createContent(
				NON_BREAKING_SPACE + t("word.error-rendering", language) + objectType + NON_BREAKING_SPACE,
				{
					style: WordFontStyles.error,
				},
			),
		]),
	]);
};
