import Theme from "@ext/Theme/Theme";

const base64phrase = "data:image/svg+xml;base64,";
const getLogoKey = (theme: Theme) => `custom_logo_${theme}`;

export const svgToBase64 = (data: string) => {
	if (!data || typeof data !== "string") return "";
	return `${base64phrase}${Buffer.from(data).toString("base64")}`;
};

const getLogoByTheme = (theme: Theme): string | undefined => localStorage.getItem(getLogoKey(theme));

const deleteImage = (theme: Theme): void => {
	localStorage.removeItem(getLogoKey(theme));
};

const updateLogo = (image: string, theme: Theme): void => {
	if (image && theme) localStorage.setItem(getLogoKey(theme), image);
	if (!image && theme) deleteImage(theme);
};

const getLogoWithCheckDark = (theme: Theme): string | undefined => {
	const logo = getLogoByTheme(theme);

	if (theme === Theme.dark && logo) return logo;
	if (theme === Theme.light) return logo;

	return getLogoByTheme(Theme.light);
};

const logoToBase64 = (data: string) => svgToBase64(data);

const isBase64Logo = (logo = "") => logo.startsWith(base64phrase);

export default { updateLogo, getLogoByTheme, getLogoWithCheckDark, deleteImage, logoToBase64, isBase64Logo };
