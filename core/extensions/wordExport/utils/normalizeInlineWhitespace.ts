export const normalizeInlineWhitespace = (value: string) =>
	value
		.replace(/\s*\r?\n\s*/g, " ")
		.replace(/\t+/g, " ")
		.replace(/\s{2,}/g, " ");
