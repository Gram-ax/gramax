import UiLanguage, { resolveLanguage } from "@ext/localization/core/model/Language";
import { useSetting, useSettingEffect, useUpdateSettings } from "@ext/settings/logic/hooks";
import { useEffect } from "react";

const LEGACY_UI_LANG_KEY = "ui-lang";

const readLegacyUiLang = (): UiLanguage | undefined => {
	if (typeof window === "undefined") return undefined;
	try {
		return UiLanguage[window.localStorage?.getItem(LEGACY_UI_LANG_KEY)];
	} catch {
		return undefined;
	}
};

// Write-through is required: the cache is rebuilt from backend values on every
// load, so a cache-only migration would not survive a reload. The legacy key is
// removed only after a successful persist so failures retry on next launch.
export const useMigrateLegacyUiLang = (): void => {
	const update = useUpdateSettings();
	// biome-ignore lint/correctness/useExhaustiveDependencies: one-time migration on mount
	useEffect(() => {
		const lang = readLegacyUiLang();
		if (!lang) return;
		update({ "general.language": lang })
			.then(() => window.localStorage.removeItem(LEGACY_UI_LANG_KEY))
			.catch(() => undefined);
	}, []);
};

let onChangeCallback: ((language: UiLanguage) => void) | undefined;

export const setOnLanguageChangeCallback = (callback: (language: UiLanguage) => void) => {
	onChangeCallback = callback;
};

export const useUiLanguage = (): UiLanguage => {
	const [lang] = useSetting("general.language");
	return resolveLanguage(lang);
};

export const useManageUiLanguage = (emit = false) => {
	const [current, setUiLanguage] = useSetting("general.language");
	useSettingEffect("general.language", (language, prev) => {
		if (prev === language) return;
		if (emit) onChangeCallback?.(language);
	});

	return [current, setUiLanguage] as const;
};
