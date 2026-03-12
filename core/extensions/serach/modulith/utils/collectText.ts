import type { SearchResultMarkItem } from "@ext/serach/Searcher";

export function collectText(items: SearchResultMarkItem[], charCount = 30): string {
	const result: string[] = [];
	let remaining = charCount;

	for (const item of items) {
		if (remaining <= 0) break;

		const len = item.text.length;
		if (len <= remaining) {
			result.push(item.text);
			remaining -= len;
		} else {
			result.push(item.text.slice(0, remaining));
			break;
		}
	}

	return result.join("");
}
