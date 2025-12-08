import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { useMemo } from "react";

export type HtmlOptions = {
	theme?: Theme;
};

export const useResolveHtmlOptions = (): HtmlOptions => {
	const theme = ThemeService.value;
	return useMemo(() => ({ theme }), [theme]);
};
