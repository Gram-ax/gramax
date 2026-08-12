import type { DiffLine } from "../types/chat";

export type DiffStats = { added: number; removed: number };

export const countDiffStats = (lines: DiffLine[]): DiffStats => {
	let added = 0;
	let removed = 0;
	for (const line of lines) {
		if (line.type === "add") added += 1;
		else if (line.type === "del") removed += 1;
	}
	return { added, removed };
};
