import { env } from "@app/resolveModule/env";

enum UiLanguage {
	en = "en",
	ru = "ru",
}

export enum ContentLanguage {
	en = "en",
	ru = "ru",
	es = "es",
	zh = "zh",
	hi = "hi",
	fr = "fr",
	ar = "ar",
	pt = "pt",
	de = "de",
	ja = "ja",
	tr = "tr",
	ko = "ko",
	it = "it",
	pl = "pl",
	nl = "nl",
	cs = "cs",
	sv = "sv",
}

export const defaultLanguage = UiLanguage.en;

export const overriddenLanguage = UiLanguage[env("DEFAULT_UI_LANGUAGE") as keyof typeof UiLanguage];

export const resolveLanguage = (current?: UiLanguage): UiLanguage => current || overriddenLanguage || defaultLanguage;

export default UiLanguage;
