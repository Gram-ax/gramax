const isCommaSeparated = (value: string) => /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(value);
const isDotSeparated = (value: string) => /^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(value);
const isNotNumber = (value: string) => /[^\d,.\s-]/g.test(value);

const parseNumber = (value: string) => {
	if (isNotNumber(value)) return;
	if (isCommaSeparated(value)) value = value.replace(/,/g, " ");
	else if (isDotSeparated(value)) value = value.replace(/\./g, " ");

	const cleanedInput = value.replace(/[^\d,.-]/g, "").replace(",", ".");
	const number = parseFloat(cleanedInput);

	return isNaN(number) ? undefined : number;
};

export default parseNumber;
