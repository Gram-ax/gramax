export interface LinkToHeadingMatch {
	path: string;
	hash: string;
}

export const getLinkToHeading = (href: string): LinkToHeadingMatch | null => {
	if (!href) return null;

	const hashIndex = href.indexOf("#");
	if (hashIndex < 0) return null;

	return {
		path: href.slice(0, hashIndex),
		hash: href.slice(hashIndex),
	};
};
