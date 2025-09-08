import { convertMillimetersToTwip } from "docx";

export const mmToTw = convertMillimetersToTwip;
export const LIST_HANGING_MM = 5; // width of the "zone of the number"
export const LIST_LEFT_INDENT_MM = (lvl: number) => 5 + 5 * lvl; // left edge of the text at the level
export const LIST_GAP_MM_DEFAULT = 0; // additional gap after the number (by default 0)
export const IMG_WIDTH_COEFF = 15; // coefficient for image width calculation tw/coef
