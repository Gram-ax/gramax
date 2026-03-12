export interface FormateNameOptions {
	replaceSpacesWithNonBreaking?: boolean;
	replaceHyphensWithNonBreaking?: boolean;
}

const formateName = (name: string, options: FormateNameOptions = {}): string => {
	const { replaceSpacesWithNonBreaking = false, replaceHyphensWithNonBreaking = false } = options;

	let formattedName = name;

	if (replaceSpacesWithNonBreaking) {
		formattedName = formattedName.replace(/ /g, "\u00A0");
	}

	if (replaceHyphensWithNonBreaking) {
		formattedName = formattedName.replace(/-/g, "\u2011");
	}

	return formattedName;
};

export default formateName;
