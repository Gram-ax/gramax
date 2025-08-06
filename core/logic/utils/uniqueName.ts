import { UNIQUE_NAME_SEPARATOR, UNIQUE_NAME_START_IDX } from "@app/config/const";

export const uniqueName = (
	originalName: string,
	neighbours: string[] = [],
	postfix = "",
	sep = UNIQUE_NAME_SEPARATOR,
) => {
	let name = originalName + postfix;
	let idx = UNIQUE_NAME_START_IDX;
	while (neighbours?.includes(name)) name = originalName + sep + idx++ + postfix;
	return name;
};
