export {
	CITATION_PLACEHOLDER_PREFIX,
	CITATION_PLACEHOLDER_REGEX,
	CITATION_PLACEHOLDER_SUFFIX,
	makeCitationPlaceholder,
} from "./utils/chatCitations/consts";

export interface SearchChatStreamItemText {
	type: "text";
	text: string;
}

export type SearchChatStreamItem = SearchChatStreamItemText;
