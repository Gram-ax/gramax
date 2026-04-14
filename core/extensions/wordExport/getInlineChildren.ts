import { inlineLayouts } from "@ext/wordExport/layouts";
import type { WordInlineChildren } from "./options/WordTypes";

export const getInlineChildren: () => WordInlineChildren = () => {
	return inlineLayouts;
};
