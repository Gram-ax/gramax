import { MAP_OLD_HIGHLIGHTS_TO_NEW } from "@ext/markdown/elements/highlight/edit/model/consts";

export const getNewColorFromOld = (color: string) => {
	return MAP_OLD_HIGHLIGHTS_TO_NEW[color] ?? color;
};
