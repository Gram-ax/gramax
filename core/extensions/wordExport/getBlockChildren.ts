import { WordBlockChildren } from "./options/WordTypes";
import { blockLayouts } from "./layouts";

export const getBlockChildren: () => WordBlockChildren = () => blockLayouts;
