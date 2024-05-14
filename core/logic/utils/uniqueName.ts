import { UNIQUE_NAME_SEPARATOR, UNIQUE_NAME_START_IDX } from "@app/config/const";

export const uniqueName = (originalName: string, neighbours: string[], postfix = "") => {
	let name = originalName + postfix;
	let idx = UNIQUE_NAME_START_IDX;
	while (neighbours.includes(name)) name = originalName + UNIQUE_NAME_SEPARATOR + idx++ + postfix;
	return name;
};
