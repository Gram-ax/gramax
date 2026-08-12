const SETTINGS_STORAGE_KEY = "app-settings-cache";

const isTheme = (value) => value === "dark" || value === "light";

const getPersistedTheme = () => {
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		const theme = parsed?.state?.values?.general?.theme;
		return isTheme(theme) ? theme : null;
	} catch {
		return null;
	}
};

const applyTheme = (theme) => {
	document.documentElement.className = theme;

	if (document.body) {
		document.body.dataset.theme = theme;
		return;
	}

	document.addEventListener(
		"DOMContentLoaded",
		() => {
			document.body.dataset.theme = theme;
		},
		{ once: true },
	);
};

const persistedTheme = getPersistedTheme();
const legacyTheme = localStorage.getItem("theme");
const fallbackTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const theme = [persistedTheme, legacyTheme, fallbackTheme].find(isTheme) ?? "light";

applyTheme(theme);
