import Theme from "../../../Theme/Theme";
import ThemeService from "../../../Theme/components/ThemeService";

export const openPrintView = (theme: Theme) => {
	let oldTheme: Theme = null;

	if (theme !== Theme.light) {
		oldTheme = theme;
		ThemeService.changeTheme(Theme.light);
	}

	print();

	if (oldTheme) void ThemeService.changeTheme(oldTheme);
};
