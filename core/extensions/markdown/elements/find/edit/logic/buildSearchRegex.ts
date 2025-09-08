const escapeRegExp: (s: string) => string =
	"escape" in RegExp && typeof (RegExp as any).escape === "function"
		? (RegExp as any).escape
		: (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchRegex = (searchTerm: string, caseSensitive: boolean, wholeWord: boolean): RegExp => {
	let flags = "g";
	if (!caseSensitive) flags += "i";

	const safeTerm = escapeRegExp(searchTerm);
	const regexString = wholeWord ? `\\b${safeTerm}\\b` : safeTerm;
	return new RegExp(regexString, flags);
};

export default buildSearchRegex;
