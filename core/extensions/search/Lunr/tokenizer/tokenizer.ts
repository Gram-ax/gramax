const tokenizer = (str: string, metadata = {}) => {
	if (!str || typeof str !== "string") return [];

	const cleanedInput = str.replace(/[-.,;:?!]/g, " ");
	return cleanedInput
		.toLowerCase()
		.split(/[\s]+/)
		.filter((token) => token.length > 0)
		.map((token) => {
			return {
				str: token,
				metadata,
			};
		});
};

tokenizer.separator = /(\s|-|\.|,|;|:|\?|!)/;

export default tokenizer;
