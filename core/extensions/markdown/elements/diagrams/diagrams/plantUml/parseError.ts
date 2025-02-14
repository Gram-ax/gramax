const parseError = (error: string) => {
	const parser = new DOMParser();
	const doc = parser.parseFromString(error, "text/html");

	const textToFind = "You will find more information about PlantUML syntax on";
	const elements = Array.from(doc.body?.firstElementChild?.lastElementChild?.getElementsByTagName("*") || []);
	const index = elements.findIndex((el) => el.textContent?.includes(textToFind));

	if (index === -1 || index + 9 > elements.length) return;
	let rectElement = elements[index + 9];
	const isLowVersion = rectElement.textContent?.includes("PlantUML");

	if (isLowVersion) rectElement = elements[index + 8];

	return elements
		.slice(index + (isLowVersion ? 8 : 9))
		.map((el) => el.textContent)
		.join("\n");
};

export default parseError;
