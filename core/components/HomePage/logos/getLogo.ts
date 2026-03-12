import Theme from "@ext/Theme/Theme";
import gramaxLogoDesktopDark from "./gramax-logo-desktop-dark.svg";
import gramaxLogoDesktopLight from "./gramax-logo-desktop-light.svg";
import gramaxLogohpDark from "./gramax-logo-hp-dark.svg";
import gramaxLogohpLight from "./gramax-logo-hp-light.svg";

const getLogo = (theme: Theme, isMobile: boolean = true) => {
	const isDarkTheme = theme === Theme.dark;
	if (isMobile) return isDarkTheme ? gramaxLogohpDark : gramaxLogohpLight;
	return isDarkTheme ? gramaxLogoDesktopDark : gramaxLogoDesktopLight;
};

export default getLogo;
