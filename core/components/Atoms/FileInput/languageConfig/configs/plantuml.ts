import type { LanguageConfigurator } from "@components/Atoms/FileInput/languageConfig/monacoLanguageConfig";

export const PLANT_UML_LANGUAGE = "plant-uml";

export const configurePlantUmlLanguage: LanguageConfigurator = (monaco) => {
	if (!monaco.languages.getLanguages().some((lang) => lang.id === PLANT_UML_LANGUAGE)) {
		monaco.languages.register({ id: PLANT_UML_LANGUAGE });
	}

	monaco.languages.setLanguageConfiguration(PLANT_UML_LANGUAGE, {
		comments: {
			lineComment: "'",
			blockComment: ["/'", "'/"],
		},
	});
};
