import { IndexDataProvider } from "@ext/serach/IndexDataProvider";
import Fuse, { FuseResult, RangeTuple } from "fuse.js";
import stringSimilarity from "string-similarity";
import { IndexData } from "../IndexData";
import Searcher, { SearchItem } from "../Searcher";
import prepareFuseString, { extractWords, normalizeQuotationMarks } from "./prepareFuseString";

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
	private _fuses: { [catalogName: string]: Fuse<IndexData> } = {};

	constructor(private _indexDataProvider: IndexDataProvider) {
		this._indexDataProvider.onDataChange?.(this._initFuses.bind(this));
	}

	async resetAllCatalogs() {
		await this._indexDataProvider.deleteCatalogs();
		this._fuses = {};
	}

	async searchAll(query: string, ids: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		let result: SearchItem[] = [];

		for (const catalogName in ids) result = result.concat(await this.search(query, catalogName, ids[catalogName]));

		return result.sort((a, b) => {
			if (a.count === b.count) return a.score - b.score;
			return b.count - a.count;
		});
	}

	async search(query: string, catalogName: string, articleIds: string[]): Promise<SearchItem[]> {
		query = normalizeQuotationMarks(query);
		const quotesCount = (query.match(/"/g) || []).length;

		if (quotesCount % 2 !== 0) {
			const lastQuoteIndex = query.lastIndexOf('"');
			if (lastQuoteIndex !== -1) {
				query = query.substring(0, lastQuoteIndex) + query.substring(lastQuoteIndex + 1);
			}
		}

		const doesQueryHaveOnlyNegativeWords =
			query.match(/-"[^"]*"\s*/g)?.join("") === query || query.match(/-[^ ]*\s*/g)?.join("") === query;

		if (!articleIds?.length || doesQueryHaveOnlyNegativeWords) return [];
		if (!this._fuses[catalogName]) await this._initFuses(catalogName);

		this._excludedWordsCount = 0;
		query = prepareFuseString(query);

		const searchedArray = this._fuses[catalogName].search(query);

		query = this._removeNegatedPhrases(query);
		query = this._removeExtraCharacters(query);

		const result: SearchItem[] = searchedArray
			.filter((searched) => articleIds.some((id) => id === searched.item.path))
			.map((searched) => this._processSearchResult(searched, query))
			.filter((searched) => searched.paragraph?.length !== 0 || searched.name.targets?.length !== 0);

		return result.sort((a, b) => {
			if (a.count === b.count) return a.score - b.score;
			return b.count - a.count;
		});
	}

	private async _initFuses(catalogName: string, indexData?: IndexData[]) {
		this._fuses[catalogName] = new Fuse(indexData ?? (await this._indexDataProvider.getCatalogValue(catalogName)), {
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
		searchItem.paragraph = this._getMatchingParagraphs(searched, query);
		searchItem.count = searchItem.name.targets.length + searchItem.paragraph.length;

		return searchItem;
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
						const similarity = stringSimilarity.compareTwoStrings(queryArray[j], target.toLowerCase());

						if (similarity > this._fuseSearchConfig.nameSimilarityOffset) {
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
		const paragraphs: { prev: string; target: string; next: string }[] = [];
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
						if (paragraph) {
							paragraphs.push(paragraph);
							break;
						}
					}
				});
			}
		});

		return paragraphs;
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

		return similarity > this._fuseSearchConfig.paragraphSimilarityOffset ? { prev, target, next } : null;
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
