import { inlineLayouts } from "@ext/wordExport/layouts";
import { WordInlineChildren } from "./options/WordTypes";

export const getInlineChildren: () => WordInlineChildren = () => {
	return inlineLayouts;
};
