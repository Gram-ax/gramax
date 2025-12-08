import type { CheckChunk, CheckSuggestion } from "@ics/gx-vector-search";
import { SuggestionItem } from "../extension/Suggestion";

export function getSuggestionItems(items: CheckSuggestion[], chunks: CheckChunk[]): SuggestionItem[] {
	return items.map((item) => {
		return {
			suggestion: item.text,
			originalSentence: chunks.find((chunk) => chunk.id === item.id)?.text,
		};
	});
}
