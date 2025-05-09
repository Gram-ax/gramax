import { IndexDataProvider } from "@ext/serach/IndexDataProvider";
import Fuse, { FuseResult, RangeTuple } from "fuse.js";
import stringSimilarity from "string-similarity";
import { IndexData } from "../IndexData";
import Searcher, { SearchItem } from "../Searcher";
import prepareFuseString, { extractWords, normalizeQuotationMarks } from "./prepareFuseString";

type paragraph = {
	prev: string;
	target: string;
	next: string;
	searchedCount?: number;
	matchIndex?: RangeTuple;
	queryIndexs?: number[];
};

export default class FuseSearcher implements Searcher {
	private _fuseSearchConfig: {
		readonly nameSimilarityOffset;
		readonly paragraphSimilarityOffset;
		readonly paragraphOffset;
	} = {
		nameSimilarityOffset: 0.8,
		paragraphSimilarityOffset: 0.8,
		paragraphOffset: 60,
	};
	private _excludedWordsCount = 0;

	constructor(private _indexDataProvider: IndexDataProvider) {}

	async resetAllCatalogs() {
		await this._indexDataProvider.clear();
	}

	async searchAll(query: string, ids: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		let result: SearchItem[] = [];
		let useAccurateSearch = true;

		for (const catalogName in ids) {
			const searchResult = await this.search(query, catalogName, ids[catalogName]);
			if (searchResult) {
				result = result.concat(searchResult);
			} else {
				useAccurateSearch = false;
			}
		}

		return result.length || useAccurateSearch
			? result.sort((a, b) => {
					if (a.count === b.count) return a.score - b.score;
					return b.count - a.count;
			  })
			: null;
	}

	async search(query: string, catalogName: string, articleIds: string[]): Promise<SearchItem[]> {
		query = normalizeQuotationMarks(query);
		const quotesCount = (query.match(/"/g) || []).length;
		const useAccurateSearch = quotesCount > 1;
		if (quotesCount % 2 !== 0) {
			const lastQuoteIndex = query.lastIndexOf('"');
			if (lastQuoteIndex !== -1) {
				query = query.substring(0, lastQuoteIndex) + query.substring(lastQuoteIndex + 1);
			}
		}

		const doesQueryHaveOnlyNegativeWords =
			query.match(/-"[^"]*"\s*/g)?.join("") === query || query.match(/-[^ ]*\s*/g)?.join("") === query;

		if (!articleIds?.length || doesQueryHaveOnlyNegativeWords) return [];
		const fuse = await this._getFuse(catalogName, articleIds);

		this._excludedWordsCount = 0;
		query = prepareFuseString(query);

		const searchedArray = fuse.search(query);

		query = this._removeNegatedPhrases(query);
		query = this._removeExtraCharacters(query);

		const result: SearchItem[] = searchedArray
			.filter((searched) => articleIds.some((id) => id === searched.item.path))
			.map((searched) => this._processSearchResult(searched, query))
			.filter((searched) => searched.paragraph?.length !== 0 || searched.name.targets?.length !== 0)
			.sort((a, b) => {
				if (a.count === b.count) return a.score - b.score;
				return b.count - a.count;
			});

		return useAccurateSearch || result.length > 0 ? result : null;
	}

	private async _getFuse(catalogName: string, articleIds: string[]) {
		return new Fuse(await this._indexDataProvider.getAndSetIndexData(catalogName, articleIds), {
			keys: [{ name: "path" }, { name: "pathname" }, { name: "title" }, { name: "content" }],
			useExtendedSearch: true,
			includeScore: true,
			includeMatches: true,
			ignoreLocation: true,
			ignoreFieldNorm: true,
			threshold: 0.2,
			shouldSort: true,
		});
	}

	private _processSearchResult(searched: FuseResult<IndexData>, query: string): SearchItem {
		const searchItem: SearchItem = {
			name: {} as { targets: { start: string; target: string }[]; end: string },
			paragraph: [],
			count: 0,
			score: searched.score,
			url: searched.item.pathname ?? "",
		};

		searchItem.name = this._getName(searched, query);
		const paragraphs = this._getMatchingParagraphs(searched, query);
		searchItem.paragraph = this._sliceParagraphs(paragraphs);
		searchItem.count = searchItem.name.targets.length + searchItem.paragraph.length;

		return searchItem;
	}

	private _exactMatch(query: string, paragraph: SearchItem["paragraph"][number]) {
		const exactMatches = query.match(/"([^"]+)"/g)?.map((q) => q.replace(/"/g, "").trim()) || [];
		return exactMatches.every((match) => {
			if (paragraph.target.toLowerCase() !== match.toLowerCase()) return true;
			const lastCharPrev = paragraph.prev.slice(-1) || " ";
			const firstCharNext = paragraph.next[0] || " ";

			return new RegExp(`(^|[^а-яА-Яa-zA-Z0-9_])${match}([^а-яА-Яa-zA-Z0-9_]|$)`, "i").test(
				lastCharPrev + paragraph.target + firstCharNext,
			);
		});
	}

	private _getName(searched: FuseResult<IndexData>, query: string) {
		const title = searched.item.title?.toString() ?? "";
		const endNameIndex = title.length;
		const name: { targets: { start: string; target: string }[]; end: string } = { targets: [], end: "" };
		const queryArray = this._getStringArray(query);
		let startNameIndex = 0;
		let endTargetIndex = 0;

		searched.matches.forEach((match) => {
			if (match.key === "title") {
				const merged: RangeTuple[] = [];
				const currentInterval = this._getCurrentInterval(match.indices, merged);

				merged.push(currentInterval);

				for (let i = 0; i < merged.length; i++) {
					if (!merged[i]) continue;
					const beginTargetIndex = merged[i][0];
					const endTargetIndexRaw = merged[i][1];
					const tempEndTargetIndex = endTargetIndexRaw + 1;
					const start = title.slice(startNameIndex, beginTargetIndex);
					const target = title.slice(beginTargetIndex, tempEndTargetIndex);

					for (let j = 0; j < queryArray.length; j++) {
						const exactMatch = this._exactMatch(query, {
							prev: title.slice(
								beginTargetIndex > 0 ? beginTargetIndex - 1 : beginTargetIndex,
								beginTargetIndex,
							),
							target,
							next: title.slice(
								tempEndTargetIndex,
								tempEndTargetIndex < endNameIndex ? tempEndTargetIndex + 1 : tempEndTargetIndex,
							),
						});
						const similarity = stringSimilarity.compareTwoStrings(queryArray[j], target.toLowerCase());

						if (similarity > this._fuseSearchConfig.nameSimilarityOffset && exactMatch) {
							startNameIndex = tempEndTargetIndex;
							endTargetIndex = tempEndTargetIndex;
							name.targets.push({ start, target });
							merged.splice(i, 1);
							i--;
							break;
						}
					}
				}
			}
		});

		name.end = title.slice(endTargetIndex, endNameIndex);
		return name;
	}

	private _getCurrentInterval(indices: readonly RangeTuple[], merged: RangeTuple[]) {
		const tempIndices = [...indices];

		for (let i = 0; i < this._excludedWordsCount; i++) tempIndices.shift();

		tempIndices.sort((a, b) => a[0] - b[0]);

		let currentInterval = tempIndices[0];

		for (let i = 1; i < tempIndices.length; i++) {
			const nextInterval = tempIndices[i];
			if (currentInterval[1] >= nextInterval[0]) {
				currentInterval = [
					Math.min(currentInterval[0], nextInterval[0]),
					Math.max(currentInterval[1], nextInterval[1]),
				];
			} else {
				merged.push(currentInterval);
				currentInterval = nextInterval;
			}
		}
		return currentInterval;
	}

	private _getMatchingParagraphs(searched: FuseResult<IndexData>, query: string) {
		const content = searched.item.content ?? "";
		const paragraphs: paragraph[] = [];
		const queryArray = this._getStringArray(query);

		searched.matches.forEach((match) => {
			const merged: RangeTuple[] = [];
			const currentInterval = this._getCurrentInterval(match.indices, merged);

			merged.push(currentInterval);

			if (match.key === "content") {
				merged.forEach((matchIndex) => {
					for (let i = 0; i < queryArray.length; i++) {
						if (!matchIndex) return;
						const paragraph = this._getMatchingParagraph(content, matchIndex, queryArray[i]);
						if (paragraph && this._exactMatch(query, paragraph)) {
							paragraphs.push({ ...paragraph, matchIndex, queryIndexs: [i] });
						}
					}
				});
			}
		});

		return paragraphs;
	}

	private _sliceParagraphs(paragraphs: paragraph[]) {
		const mergedParagraphs: paragraph[] = [];
		let lastParagraph: paragraph | null = null;

		paragraphs.forEach((paragraph) => {
			const queryIndex = paragraph.queryIndexs[0];
			if (
				lastParagraph?.queryIndexs.every((f) => f !== queryIndex) &&
				this._areAdjacent(lastParagraph.matchIndex, paragraph.matchIndex)
			) {
				lastParagraph.target += " " + paragraph.target;
				lastParagraph.next = paragraph.next;
				lastParagraph.searchedCount += 1;
				lastParagraph.queryIndexs.push(queryIndex);
				lastParagraph.matchIndex[1] = paragraph.matchIndex[1];
			} else {
				mergedParagraphs.push(paragraph);
				lastParagraph = paragraph;
			}
		});

		mergedParagraphs.sort((a, b) => {
			return b.searchedCount - a.searchedCount;
		});

		return mergedParagraphs;
	}

	private _areAdjacent(lastArray: RangeTuple, matchIndex: RangeTuple, maxDistance: number = 2): boolean {
		return matchIndex[0] <= lastArray[1] + maxDistance;
	}

	private _getMatchingParagraph(text: string, matchIndex: [number, number], query: string) {
		const [startIndex, endIndex] = matchIndex;
		const prevStart = Math.max(0, startIndex - this._fuseSearchConfig.paragraphOffset);
		const nextEnd = Math.min(text.length - 1, endIndex + this._fuseSearchConfig.paragraphOffset);
		const prev = prevStart > 0 ? "..." + text.slice(prevStart, startIndex) : text.slice(prevStart, startIndex);
		const target = text.slice(startIndex, endIndex + 1);
		const next =
			endIndex < nextEnd ? text.slice(endIndex + 1, nextEnd + 1) + "..." : text.slice(endIndex + 1, nextEnd + 1);
		const similarity = stringSimilarity.compareTwoStrings(query, target.toLowerCase());

		return similarity > this._fuseSearchConfig.paragraphSimilarityOffset
			? { prev, target, next, searchedCount: 0 }
			: null;
	}

	private _getStringArray(str: string) {
		const words = extractWords(str);
		const uniqueWords = [...new Set(words.map((word) => word.replace(/["']/g, "")))];

		return uniqueWords;
	}

	private _removeNegatedPhrases(str: string): string {
		const negativePhrasePattern = /!"[^"]*"\s*/g;
		const negativeWordsPattern = /![^ ]*\s*/g;

		const matchesPattern = str.match(negativeWordsPattern);

		this._excludedWordsCount += matchesPattern?.length ?? 0;

		return str.replace(negativePhrasePattern, "").replace(negativeWordsPattern, "");
	}

	private _removeExtraCharacters(str: string): string {
		return str.replace(/ (['=^])/g, " ").replace(/([$]) /g, " ");
	}
}
