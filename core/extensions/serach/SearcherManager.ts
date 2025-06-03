import ChatBotSearcher from "@ext/serach/ChatBotSearcher";
import Searcher from "@ext/serach/Searcher";
import assert from "assert";

const searcherTypes = ["vector"] as const;

export type SearcherType = (typeof searcherTypes)[number];

export function isSearcherType(str: string): str is SearcherType {
	return searcherTypes.some((x) => x === str);
}

export default class SearcherManager {
	constructor(
		private readonly _defaultSearcher: Searcher,
		private readonly _chatBotSearcher?: ChatBotSearcher,
		private readonly _extraSearchers: Partial<Record<SearcherType, Searcher>> = {}
	) {}

	getSearcher(type?: SearcherType): Searcher {
		if (type) {
			const searcher = this._extraSearchers[type];
			assert(searcher, `Searcher of type ${type} not found`);
			return searcher;
		}

		return this._defaultSearcher;
	}

	getChatBotSearcher(): ChatBotSearcher {
		assert(this._chatBotSearcher, "Chatbot searcher not initialized");
		return this._chatBotSearcher;
	}
}
