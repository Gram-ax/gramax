import type { Property } from "@ext/properties/models";

const sortMapByName = (keys: string[], sortObject: Property[]) =>
	sortObject.sort((a, b) => {
		const aIndex = keys.indexOf(a.id);
		const bIndex = keys.indexOf(b.id);
		return aIndex - bIndex;
	});

export default sortMapByName;
