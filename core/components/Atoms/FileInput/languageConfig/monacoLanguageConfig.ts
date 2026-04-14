import {
	configurePlantUmlLanguage,
	PLANT_UML_LANGUAGE,
} from "@components/Atoms/FileInput/languageConfig/configs/plantuml";
import type { editor } from "monaco-editor";
import type * as monacoType from "monaco-editor/esm/vs/editor/editor.api";

type Monaco = typeof monacoType;
export type LanguageConfigurator = (monaco: Monaco) => void;

const configuredLanguages = new Set<string>();

const languageConfigurations: Record<string, LanguageConfigurator> = {
	[PLANT_UML_LANGUAGE]: configurePlantUmlLanguage,
};

export const ensureMonacoLanguageConfigured = (monaco: Monaco, language?: string): void => {
	if (!language) return;

	const configurator = languageConfigurations[language];
	if (!configurator) return;
	if (configuredLanguages.has(language)) return;

	configurator(monaco);
	configuredLanguages.add(language);
};

export const syncEditorModelLanguage = (
	codeEditor: editor.IStandaloneCodeEditor,
	monaco: Monaco,
	language?: string,
): void => {
	if (!language) return;

	const model = codeEditor.getModel();
	if (!model) return;

	monaco.editor.setModelLanguage(model, language);
};
