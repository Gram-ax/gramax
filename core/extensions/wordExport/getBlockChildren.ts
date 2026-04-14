import { blockLayouts } from "./layouts";
import type { WordBlockChildren } from "./options/WordTypes";

export const getBlockChildren: () => WordBlockChildren = () => {
	return blockLayouts;
};
