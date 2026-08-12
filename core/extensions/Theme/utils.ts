import { cachedSettingsStore, getCachedSetting } from "@ext/settings/logic/cachedSettingsStore";
import Theme from "@ext/Theme/Theme";
import { useLayoutEffect } from "react";

export const validateTheme = (data: unknown, fallback: Theme = Theme.light): Theme => {
	if (typeof data !== "string") return fallback;
	if (data === Theme.dark) return Theme.dark;
	if (data === Theme.light) return Theme.light;
	return fallback;
};

export const writeToDom = (theme: Theme) => {
	if (typeof document === "undefined") return;
	document.body.dataset.theme = theme;
	document.documentElement.className = theme;
};

export const useApplyTheme = () => {
	useLayoutEffect(() => {
		const theme = getCachedSetting("general.theme");
		writeToDom(validateTheme(theme));

		let prev = getCachedSetting("general.theme");
		return cachedSettingsStore.subscribe((s) => {
			const next = s.values.general.theme;
			if (next === prev) return;
			prev = next;
			writeToDom(validateTheme(next));
		});
	}, []);
};
