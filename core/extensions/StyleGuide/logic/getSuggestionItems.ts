import { RequestParagraphModel } from "gx-ai/dist/gpt/styleGuideGpt/styleGuideGptRequest";
import { SuggestionItem } from "../extension/Suggestion";

export function getSuggestionItems(
	items: { text: string; id: number }[],
	sentences: RequestParagraphModel[],
): SuggestionItem[] {
	return items.map((item) => {
		return {
			suggestion: item.text,
			originalSentence: sentences.find((sentence) => sentence.id === item.id)?.text,
		};
	});
}
