import { getLangImportFuncByName } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import { createLowlight } from "lowlight";
import noneLang from "@ext/markdown/elements/codeBlockLowlight/edit/logic/langs/none";

export const lowlight = createLowlight({ none: noneLang });

const loadedLanguages = new Set<string>(["none"]);

export function checkLanguage(languageName: string): boolean {
	return loadedLanguages.has(languageName);
}

export async function loadLanguage(languageName: string): Promise<typeof lowlight | void> {
	if (loadedLanguages.has(languageName)) return lowlight;

	const importFn = await getLangImportFuncByName(languageName);
	if (!importFn) return;

	try {
		lowlight.register(languageName, importFn);
		loadedLanguages.add(languageName);

		return lowlight;
	} catch (error) {
		console.error(error);
	}
}

export default lowlight;
