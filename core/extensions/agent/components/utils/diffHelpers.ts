import type { ChatMessage, DiffBlock, DiffLine } from "../types/chat";

export function getDiffBlocks(message: ChatMessage): DiffBlock[] {
	if (message.diffs && message.diffs.length > 0) return message.diffs;
	if (message.diff) return [message.diff];
	return [];
}

export type DiffStats = { added: number; removed: number };

export function countDiffStats(lines: DiffLine[]): DiffStats {
	let added = 0;
	let removed = 0;
	for (const line of lines) {
		if (line.type === "add") added += 1;
		else if (line.type === "del") removed += 1;
	}
	return { added, removed };
}
