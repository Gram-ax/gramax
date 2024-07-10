import { NON_BREAKING_SPACE, WordFontStyles } from "./options/wordExportSettings";
import useBareLocalize from "@ext/localization/useLocalize/useBareLocalize";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { createParagraph } from "@ext/wordExport/createParagraph";
import Language from "@ext/localization/core/model/Language";

export const errorWordLayout = async (objectType: string, language: Language) => {
	return Promise.resolve([
		createParagraph([
			createContent(
				NON_BREAKING_SPACE +
					useBareLocalize("errorRenderingWord", language) +
					objectType +
					NON_BREAKING_SPACE,
				{
					style: WordFontStyles.error,
				},
			),
		]),
	]);
};
