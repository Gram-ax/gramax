import type Language from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { NON_BREAKING_SPACE, WordFontStyles } from "./options/wordExportSettings";

export const errorWordLayout = async (objectType: string, language: Language) => {
	return Promise.resolve([
		createParagraph([
			createContent(NON_BREAKING_SPACE + t("word.error-rendering", language) + objectType + NON_BREAKING_SPACE, {
				style: WordFontStyles.error,
			}),
		]),
	]);
};
