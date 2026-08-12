import getChildTextId from "@ext/markdown/elements/heading/logic/getChildTextId";

const getUniqueHeadingId = (heading: HTMLElement, text: string): string => {
	const baseId = getChildTextId(text);
	let id = baseId;
	let suffix = 1;
	let element = heading.ownerDocument.getElementById(id);

	while (element && element !== heading) {
		id = `${baseId}-${suffix}`;
		suffix++;
		element = heading.ownerDocument.getElementById(id);
	}

	return id;
};

export default getUniqueHeadingId;
