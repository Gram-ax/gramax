import { UNIQUE_NAME_SEPARATOR, UNIQUE_NAME_START_IDX } from "@app/config/const";

export const uniqueName = (
	originalName: string,
	neighbours: string[] = [],
	postfix = "",
	sep = UNIQUE_NAME_SEPARATOR,
	lowercase = false,
) => {
	let name = `${originalName}${postfix}`;
	let normalizedName = lowercase ? name.toLowerCase() : name;
	let idx = UNIQUE_NAME_START_IDX;
	const normalizedNeighbours = lowercase ? neighbours.map((name) => name.toLowerCase()) : neighbours;
	while (normalizedNeighbours?.includes(normalizedName)) {
		name = `${originalName}${sep}${idx++}${postfix}`;
		normalizedName = lowercase ? name.toLowerCase() : name;
	}
	return name;
};
