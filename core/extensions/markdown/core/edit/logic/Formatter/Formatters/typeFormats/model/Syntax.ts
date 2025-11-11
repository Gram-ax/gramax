export enum Syntax {
	github = "GitHub Flavored Markdown",
	legacy = "Legacy",
	xml = "XML",
}

export const compareSyntax = (syntax1: Syntax, syntax2: Syntax) => {
	return syntax1?.toLowerCase() === syntax2?.toLowerCase();
};
