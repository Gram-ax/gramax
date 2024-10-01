import { IndexDataProvider } from "@ext/serach/IndexDataProvider";
import lunr from "lunr";
import Searcher, { SearchItem } from "../Searcher";
import customPipeline from "./tokenizer/customPipeline";
import tokenizer from "./tokenizer/tokenizer";

export default class LunrSearcher implements Searcher {
	private _catalogsIndexes: { [catalogName: string]: lunr.Index } = {};
	private _paragraphOffset = 30;

	constructor(private _indexDataProvider: IndexDataProvider) {
		lunr.Pipeline.registerFunction(customPipeline, "customPipeline");
	}

	async resetAllCatalogs() {
		await this._indexDataProvider.deleteCatalogs();
		this._catalogsIndexes = {};
	}

	async searchAll(query: string, itemRefs: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		let result: SearchItem[] = [];
		for (const catalogName in itemRefs) {
			result = result.concat(await this.search(query, catalogName, itemRefs[catalogName]));
		}
		return result.sort((a, b) => {
			return a.score < b.score ? 1 : -1;
		});
	}

	async search(query: string, catalogName: string, artilceIds: string[]): Promise<SearchItem[]> {
		query = query.replace(/ *-[- +]*/g, " -").replace(/ *\+[- +]*/g, " +");

		if (query[query.length - 1] == "-" || query[query.length - 1] == "+") query = query.slice(0, query.length - 1);

		if (query.replace(/[- +*]/g, "") == "") return Promise.resolve([] as SearchItem[]);

		if (!this._catalogsIndexes[catalogName]) await this._initCatalog(catalogName);
		const result = <SearchItem[]>[];
		const datas = await this._indexDataProvider.getCatalogValue(catalogName);

		this._catalogsIndexes[catalogName].search(query).forEach((entry) => {
			if (!artilceIds.some((r) => r == entry.ref)) return;
			const article = datas.find((article) => article.path === entry.ref);

			const paragraph = article.content;
			const searchItem: SearchItem = {
				name: {} as { targets: { start: string; target: string }[]; end: string },
				url: article.pathname,
				paragraph: [],
				count: 0,
				score: entry.score,
			};

			searchItem.name.targets = [];
			const titleHighlight = [] as { start: number; end: number }[];

			for (const data in entry.matchData.metadata) {
				if ((entry.matchData.metadata as any)[data].content) {
					const position = (entry.matchData.metadata as any)[data].content.position[0];
					let start = position[0] - this._paragraphOffset;
					let end = position[0] + position[1] + this._paragraphOffset;
					if (start < 0) start = 0;
					if (end >= paragraph.length) end = paragraph.length;
					let prev = paragraph.slice(start, position[0]);
					let next = paragraph.slice(position[0] + position[1], end);
					if (!(start === 0)) prev = "..." + prev;
					if (!(end === paragraph.length)) next += "...";
					searchItem.count += (entry.matchData.metadata as any)[data].content.position.length;
					searchItem.paragraph.push({
						prev,
						target: paragraph.slice(position[0], position[0] + position[1]),
						next,
					});
				}

				if ((entry.matchData.metadata as any)[data].title) {
					const position = (entry.matchData.metadata as any)[data].title.position[0];
					titleHighlight.push({ start: position[0], end: position[0] + position[1] });
				}
			}

			titleHighlight.sort((a, b) => {
				return a.start < b.start ? -1 : 1;
			});

			const title = article.title ?? "";
			let prevEndPos = 0;
			for (const pos of titleHighlight) {
				if (pos.start >= prevEndPos) {
					searchItem.name.targets.push({
						start: title.slice(prevEndPos, pos.start),
						target: title.slice(pos.start, pos.end),
					});

					prevEndPos = pos.end;
				}
			}

			searchItem.name.end = title.slice(prevEndPos);
			result.push(searchItem);
		});

		return Promise.resolve(result);
	}

	private async _initCatalog(catalogName: string) {
		await this._createIdx(catalogName);
	}

	private async _createIdx(catalogName: string) {
		const data = await this._indexDataProvider.getCatalogValue(catalogName);
		this._catalogsIndexes[catalogName] = lunr(function () {
			this.ref("path");
			this.field("content");
			this.field("title", { boost: 10 });

			this.tokenizer(tokenizer);
			this.pipeline.add(customPipeline);
			this.searchPipeline.add(customPipeline);

			this.pipeline.remove(lunr.trimmer);
			this.pipeline.remove(lunr.stopWordFilter);
			this.pipeline.remove(lunr.stemmer);

			this.searchPipeline.remove(lunr.trimmer);
			this.searchPipeline.remove(lunr.stopWordFilter);
			this.searchPipeline.remove(lunr.stemmer);

			this.metadataWhitelist = ["position"];
			Array.from(data).forEach((d) => {
				this.add(d);
			});
		});
	}
}
