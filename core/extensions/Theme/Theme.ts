enum Theme {
	dark = "dark",
	light = "light",
}

// Lives here instead of Theme/utils.ts to stay importable from the settings
// schema without pulling in the cachedSettingsStore cycle.
export const osTheme = (): Theme | undefined => {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? Theme.dark : Theme.light;
};

export const resolveDefaultTheme = (): Theme => osTheme() ?? Theme.light;

export default Theme;
