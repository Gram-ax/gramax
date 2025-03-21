import Theme from "@ext/Theme/Theme";

const base64phrase = "data:image/svg+xml;base64,";
const getLogoKey = (theme: Theme) => `custom_logo_${theme}`;
export const svgToBase64 = (data: string) => {
	if (!data || typeof data !== "string") return "";
	return `${base64phrase}${Buffer.from(data).toString("base64")}`;
};

class CustomLogoDriver {
	static updateLogo(image: string, theme: Theme): void {
		if (image && theme) localStorage.setItem(getLogoKey(theme), image);
		if (!image && theme) CustomLogoDriver.deleteImage(theme);
	}

	static getLogoByTheme(theme: Theme): string | undefined {
		return localStorage.getItem(getLogoKey(theme));
	}

	static getLogoWithCheckDark(theme: Theme): string | undefined {
		const logo = CustomLogoDriver.getLogoByTheme(theme);

		if (theme === Theme.dark && Boolean(logo)) return logo;
		if (theme === Theme.light) return logo;

		return CustomLogoDriver.getLogoByTheme(Theme.light);
	}

	static deleteImage(theme: Theme): void {
		localStorage.removeItem(getLogoKey(theme));
	}

	static logoToBase64(data: string) {
		return svgToBase64(data);
	}

	static isBase64Logo(logo = "") {
		return logo.startsWith(base64phrase);
	}
}

export default CustomLogoDriver;
