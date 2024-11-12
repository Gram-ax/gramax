import { Property } from "@ext/properties/models";

const sortMapByName = (keys: string[], sortObject: Property[]) =>
	sortObject.sort((a, b) => {
		const aIndex = keys.indexOf(a.name);
		const bIndex = keys.indexOf(b.name);
		return aIndex - bIndex;
	});

export default sortMapByName;
