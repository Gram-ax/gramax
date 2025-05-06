import { blockLayouts } from "./layouts";
import { WordBlockChildren } from "./options/WordTypes";

export const getBlockChildren: () => WordBlockChildren = () => {
	return blockLayouts;
};
