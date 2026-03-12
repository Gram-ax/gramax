export const CITATION_PLACEHOLDER_PREFIX = "\u200B\u2060CIT\u2060";
export const CITATION_PLACEHOLDER_SUFFIX = "\u2060\u200B";

export const makeCitationPlaceholder = (index: number, logicPath: string, relativePath: string): string =>
	`${CITATION_PLACEHOLDER_PREFIX}${index}\u2060${logicPath}\u2060${relativePath}\u2060${CITATION_PLACEHOLDER_SUFFIX}`;

export const CITATION_PLACEHOLDER_REGEX =
	/\u200B\u2060CIT\u2060(\d+)\u2060([^\u2060]+)\u2060([^\u2060]+)\u2060\u2060\u200B/g;
