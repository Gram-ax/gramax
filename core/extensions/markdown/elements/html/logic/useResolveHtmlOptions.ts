import { useSetting } from "@ext/settings/logic/hooks";
import type Theme from "@ext/Theme/Theme";
import { useMemo } from "react";

export type HtmlOptions = {
	theme?: Theme;
};

export const useResolveHtmlOptions = (): HtmlOptions => {
	const [theme] = useSetting("general.theme");
	return useMemo(() => ({ theme }), [theme]);
};
