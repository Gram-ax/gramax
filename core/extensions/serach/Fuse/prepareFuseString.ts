const prepareFuseString = (input: string): string => {
	input = input + " ";
	input = input.toLowerCase();
	input = input.replace(/\s\|\s/g, " ");
	input = input.replace(/(^|\s)[!']\S+/g, (match) => match.replace(/[!']/g, ""));
	input = input.replace(/(^|\s)-\S+/g, (match) => match.replace("-", "!"));
	input = moveNegativeMatchesToFront(input);

	return input;
};

const addQuoteIfNeeded = (input: string): string => {
	return input.replace(/(^|[^-])"([^"]+)"/g, (match, p1, p2) => {
		return `${p1} '"${p2}"`;
	});
};

const moveNegativeMatchesToFront = (input: string): string => {
	const negativePhrasePattern = /\s-!"[^"]*"\s*/g;
	const negativePhrases = input.match(negativePhrasePattern) || [];
	let modifiedInput = input.replace(negativePhrasePattern, " ");

	const negativeWordsPattern = /\s![^ ]*\s*/g;
	const negativeWords = modifiedInput.match(negativeWordsPattern) || [];
	modifiedInput = modifiedInput.replace(negativeWordsPattern, " ");
	modifiedInput = addQuoteIfNeeded(modifiedInput);

	const movedToFront = [...negativePhrases, ...negativeWords].join(" ") + modifiedInput;

	return movedToFront;
};

export const extractWords = (str: string): string[] => {
	const phrasePattern = /"[^"]*"|\S+/g;
	const words = [];
	let phrase = phrasePattern.exec(str);

	while (phrase) {
		words.push(phrase[0]);
		phrase = phrasePattern.exec(str);
	}

	return words;
};

export const normalizeQuotationMarks = (query: string) => {
	return query.replace(/“/g, '"');
};

export default prepareFuseString;
