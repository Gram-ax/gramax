import { UNIQUE_NAME_SEPARATOR, UNIQUE_NAME_START_IDX } from "@app/config/const";
import assert from "assert";

export const uniqueName = (
	originalName: string,
	neighbours: string[] = [],
	postfix = "",
	sep = UNIQUE_NAME_SEPARATOR,
	lowercase = false,
): string => {
	return uniqueNameWithIndex(originalName, neighbours, postfix, sep, lowercase)[0];
};

export const uniqueNameWithIndex = (
	originalName: string,
	neighbours: string[] = [],
	postfix = "",
	sep = UNIQUE_NAME_SEPARATOR,
	lowercase = false,
): [string, number] => {
	let name = `${originalName}${postfix}`;
	let normalizedName = lowercase ? name.toLowerCase() : name;
	let idx = UNIQUE_NAME_START_IDX;
	const normalizedNeighbours = lowercase ? neighbours.map((name) => name.toLowerCase()) : neighbours;
	while (normalizedNeighbours?.includes(normalizedName)) {
		name = `${originalName}${sep}${idx++}${postfix}`;
		normalizedName = lowercase ? name.toLowerCase() : name;
	}

	return [name, idx - 1];
};

export const unique = <T>(
	initial: T,
	includes: (name: T) => boolean,
	next: (name: T, idx: number) => T,
): [T, number] => {
  const maxIter = 100;
	let idx = UNIQUE_NAME_START_IDX;
	while (includes(initial)) {
    assert(idx < maxIter, "Unique name iteration limit exceeded");
		initial = next(initial, idx++);
	}

	return [initial, idx - 1];
};
