import { RequestParagraphModel } from "gx-ai/dist/gpt/styleGuideGpt/styleGuideGptRequest";
import { StyleGuideGptResponseModel } from "gx-ai/dist/gpt/styleGuideGpt/styleGuideGptResponse";
import { SuggestionItem } from "../extension/Suggestion";

export function getSuggestionItems(
	result: StyleGuideGptResponseModel,
	sentences: RequestParagraphModel[],
): SuggestionItem[] {
	return result.suggestions.map((item) => {
		return {
			suggestion: enhanceSuggestionTags(item.text, item.name),
			originalSentence: sentences.find((sentence) => sentence.id === item.id)?.text,
		};
	});
}

function enhanceSuggestionTags(input: string, name: string): string {
	return input.replace(
		/<suggestion(?:\s+text=['"]([^'"]*)['"])?(?:\s+description=['"]([^'"]*)['"])?>(.*?)<\/suggestion>/g,
		(_, text, description, originalText) => {
			let attributes = `originalText="${originalText || ""}" name="${name}"`;

			if (text !== null && text !== undefined) {
				attributes = `text="${text}" ${attributes}`;
			}
			if (description) {
				attributes = `description="${description}" ${attributes}`;
			}

			return `<suggestion ${attributes}>${originalText || ""}</suggestion>`;
		},
	);
}
