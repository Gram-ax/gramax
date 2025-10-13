import { ConfluenceArticleTree } from "@ext/confluence/core/model/ConfluenceArticle";

const latinCollator = new Intl.Collator("en", { sensitivity: "base" });
const cyrillicCollator = new Intl.Collator("ru", { sensitivity: "base" });
const defaultCollator = new Intl.Collator(undefined, { sensitivity: "base" });
const latinPattern = /^[A-Za-z]/;
const cyrillicPattern = /^[\u0400-\u04FF]/;

const getAlphabetGroup = (title: string): number => {
	const normalized = title?.trim() || "";
	const firstChar = normalized.charAt(0);
	if (latinPattern.test(firstChar)) return 0;
	if (cyrillicPattern.test(firstChar)) return 1;
	return 2;
};

const compareTitles = (aTitle: string, bTitle: string): number => {
	const groupA = getAlphabetGroup(aTitle);
	const groupB = getAlphabetGroup(bTitle);

	if (groupA !== groupB) {
		return groupA - groupB;
	}

	const collator = groupA === 0 ? latinCollator : groupA === 1 ? cyrillicCollator : defaultCollator;

	return collator.compare(aTitle, bTitle);
};

const resolvePosition = (node: ConfluenceArticleTree): number =>
	typeof node.position === "number" ? node.position : Number.MAX_SAFE_INTEGER;

export const sortConfluenceArticles = (nodes: ConfluenceArticleTree[]): void => {
	const shouldSortAlphabetically = nodes.length > 0 && nodes.every((node) => node.position === -1);

	if (shouldSortAlphabetically) {
		nodes.sort((a, b) => compareTitles(a.title, b.title));
	} else {
		nodes.sort((a, b) => resolvePosition(a) - resolvePosition(b));
	}
};
