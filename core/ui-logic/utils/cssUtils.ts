const mediumest = "(max-width: 71rem)";
const medium = "(max-width: 62rem)";
const narrow = "(max-width: 40rem)";
const wide = "(min-width: 72rem)";
const narrowest = "(max-width: 26rem)";

export const mediaQueries = {
	narrowest: `only screen and ${narrowest}`,
	narrow: `only screen and ${narrow}`,
	moreThanNarrow: "only screen and (min-width: 40rem)",
	medium: `only screen and ${medium}`,
	mediumest: `only screen and ${mediumest}`,
	wide: `only screen and ${wide}`,
};

export const cssMedia = {
	narrowest: `@media ${mediaQueries.narrowest}`,
	narrow: `@media ${mediaQueries.narrow}`,
	moreThanNarrow: `@media ${mediaQueries.moreThanNarrow}`,
	medium: `@media ${mediaQueries.medium}`,
	mediumest: `@media ${mediaQueries.mediumest}`,
	wide: `@media ${mediaQueries.wide}`,

	JSmediumest: mediumest,
	JSmedium: medium,
	JSnarrowest: narrowest,
	JSnarrow: narrow,
};
