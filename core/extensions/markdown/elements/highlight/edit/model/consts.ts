export enum HIGHLIGHT_COLOR_NAMES {
	DEFAULT = "default",
	LEMON_YELLOW = "lemon-yellow",
	MINT_GREEN = "mint-green",
	LAVENDER = "lavender",
	ICE_BLUE = "ice-blue",
	PEACH = "peach",
	LIGHT_PINK = "light-pink",
	GRAYISH_BLUE = "grayish-blue",
}

export const HIGHLIGHT_DOCX_NAMES: Record<Exclude<HIGHLIGHT_COLOR_NAMES, HIGHLIGHT_COLOR_NAMES.DEFAULT>, string> = {
	[HIGHLIGHT_COLOR_NAMES.LEMON_YELLOW]: "yellow",
	[HIGHLIGHT_COLOR_NAMES.MINT_GREEN]: "green",
	[HIGHLIGHT_COLOR_NAMES.LAVENDER]: "magenta",
	[HIGHLIGHT_COLOR_NAMES.ICE_BLUE]: "blue",
	[HIGHLIGHT_COLOR_NAMES.PEACH]: "darkYellow",
	[HIGHLIGHT_COLOR_NAMES.LIGHT_PINK]: "red",
	[HIGHLIGHT_COLOR_NAMES.GRAYISH_BLUE]: "darkGray",
};
