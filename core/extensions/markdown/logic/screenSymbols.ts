const screenSymbols = (str: string): string => {
	if (!str) return "";
	const specialCharacters = {
		"\\": "\\\\",
		// "'": "\\'",
		'"': '\\"',
		// $: "\\$",
		"\n": "\\n",
		"\r": "\\r",
		"\t": "\\t",
		"\b": "\\b",
		"\f": "\\f",
	};

	let result = "";

	for (let i = 0; i < str.length; i++) {
		if (Object.prototype.hasOwnProperty.call(specialCharacters, str[i])) result += specialCharacters[str[i]];
		else result += str[i];
	}

	return result;
};

export default screenSymbols;
