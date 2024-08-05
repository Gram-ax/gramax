import LanguageService from "@core-ui/ContextServices/Language";
import { getContext } from "../../../../apps/next/logic/Context/getContext";
import Language, { defaultLanguage } from "../core/model/Language";
import en from "./locale.en";
import ru from "./locale.ru";

export type FormDefinition = {
	[name: string]: {
		name?: string;
		description?: string;
		props: { [prop: string]: { name: string; placeholder?: string; description?: string } };
	};
};

export type Locale = typeof ru;
export type DefaultLocaleType = typeof defaultLocale;

type TranslationKey = ObjectDotNotation<Omit<DefaultLocaleType, "forms"> & { forms: FormDefinition }>;

const defaultLocale = ru;
const locales = { [Language.ru]: ru, [Language.en]: en };

type BreakDownObject<O, R = void> = {
	[K in keyof O as string]: K extends string
		? R extends string
			? ObjectDotNotation<O[K], `${R}.${K}`>
			: ObjectDotNotation<O[K], K>
		: never;
};

type ObjectDotNotation<O, R = void> = O extends string
	? R extends string
		? R
		: never
	: BreakDownObject<O, R>[keyof BreakDownObject<O, R>];

const resolveLanguage = (): Language => {
	return getContext()?.ui ?? LanguageService.currentUi() ?? defaultLanguage;
};

const resolveTranslationMap = (language: Language) => locales[language] ?? defaultLocale;

const t = (key: TranslationKey, forceLanguage?: Language) => {
	if (!key) return;
	const language = forceLanguage ?? resolveLanguage();
	const locale = resolveTranslationMap(language);

	if (key.includes(".")) {
		const keys = key.split(".");
		let val = locale;
		for (const part of keys) {
			val = val?.[part];
			if (!val) return key;
		}
		return val;
	}

	return locale[key] ?? key;
};

export const hasTranslation = (key: TranslationKey): boolean => t(key, defaultLanguage) != key;

export default t;
