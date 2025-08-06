const mediumest = "(max-width: 71rem)";
const medium = "(max-width: 62rem)";
const narrow = "(max-width: 40rem)";
const wide = "(min-width: 72rem)";

export const cssMedia = {
	narrowest: "@media only screen and (max-width: 26rem)",
	narrow: `@media only screen and ${narrow}`,
	moreThanNarrow: "@media only screen and (min-width: 40rem)",
	medium: `@media only screen and ${medium}`,
	mediumest: `@media only screen and ${mediumest}`,
	wide: `@media only screen and ${wide}`,

	JSmediumest: mediumest,
	JSmedium: medium,
	JSnarrow: narrow,
};
