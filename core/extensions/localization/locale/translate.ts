import LanguageService from "@core-ui/ContextServices/Language";
import { getContext } from "../../../../apps/next/logic/Context/getContext";
import UiLanguage, { defaultLanguage, type ContentLanguage } from "../core/model/Language";
import en from "./locale.en";
import ru from "./locale.ru";

export type FormDefinition = {
	[name: string]: {
		name?: string;
		description?: string;
		props: { [prop: string]: { name: string; placeholder?: string; description?: string } };
	};
};

export type Locale = typeof en;
export type DefaultLocale = typeof defaultLocale;

type TranslationKey = ObjectDotNotation<Omit<DefaultLocale, "forms"> & { forms: FormDefinition }>;

const defaultLocale = en;
const locales = { [UiLanguage.ru]: ru, [UiLanguage.en]: en };

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

const resolveLanguage = (): UiLanguage => {
	return getContext()?.ui ?? LanguageService.currentUi() ?? defaultLanguage;
};

const resolveTranslationMap = (language: UiLanguage) => locales[language] ?? defaultLocale;

const t = (key: TranslationKey, forceLanguage?: UiLanguage) => {
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

export const convertContentToUiLanguage = (l: ContentLanguage): UiLanguage =>
	UiLanguage[l] || LanguageService.currentUi() || defaultLanguage;

export default t;
