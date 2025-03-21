const toggleSignature = (
	prev: boolean,
	input: HTMLInputElement,
	updateAttributes: (attributes: Record<string, any>) => void,
): boolean => {
	const newValue = !prev;

	if (newValue) {
		input.focus();
	} else {
		input.blur();
		input.value = "";
		updateAttributes({ title: "" });
	}

	return newValue;
};

export default toggleSignature;
