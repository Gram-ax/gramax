import { INSERTION_BUTTON_SIZE, SIDEBAR_MENU_SUB_INDENT } from "./constants";

// hit zone of the icon at depth d is the icon plus the connector right of it. The threshold for switching is at the left edge of the next icon.
export const depthFromMouseX = (offsetX: number, maxDepth: number, minDepth: number, levelOffset = 0): number => {
	const iconLeftOffset = INSERTION_BUTTON_SIZE / 2 - 0.5;
	const raw = Math.floor((offsetX + iconLeftOffset) / SIDEBAR_MENU_SUB_INDENT) + 1 + levelOffset;
	return Math.min(maxDepth, Math.max(minDepth, raw));
};

// returns the CSS left for the icon at the given depth — centers the icon on the indent line
export const iconLeft = (depth: number, levelOffset = 0): number => {
	return (depth - 1 - levelOffset) * SIDEBAR_MENU_SUB_INDENT - INSERTION_BUTTON_SIZE / 2 + 0.5;
};
