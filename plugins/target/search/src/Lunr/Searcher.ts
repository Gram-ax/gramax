import { PCatalogs, PChangeCatalog, PStorage } from "@core/Plugin";
import lunr from "lunr";
import htmlToString from "plugins/target/search/src/utils/htmlToString";
import Searcher, { SearchItem } from "../Searcher";
import customPipeline from "./tokenizer/customPipeline";
import tokenizer from "./tokenizer/tokenizer";

interface IndexData {
	title: string;
	id: string;
	logicPath: string;
	content: string;
}

export default class LunrSearcher implements Searcher {
	private _catalogs: { [catalogName: string]: IndexData[] } = {};
	private _catalogsIndexes: { [catalogName: string]: lunr.Index } = {};
	private _paragraphOffset = 30;

	constructor(private _lib: PCatalogs, private _cache: PStorage) {
		this._lib.onUpdate(this._getOnUpdate().bind(this));
		lunr.Pipeline.registerFunction(customPipeline, "customPipeline");
	}

	resetAllCatalogs() {
		this._catalogs = {};
		this._catalogsIndexes = {};
		return Promise.resolve();
	}

	async searchAll(query: string, ids: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		let result: SearchItem[] = [];
		for (const catalogName in ids) {
			result = result.concat(await this.search(query, catalogName, ids[catalogName]));
		}
		return result.sort((a, b) => {
			return a.score < b.score ? 1 : -1;
		});
	}

	async search(query: string, catalogName: string, ids: string[]): Promise<SearchItem[]> {
		query = query.replace(/ *-[- +]*/g, " -").replace(/ *\+[- +]*/g, " +");
		if (query[query.length - 1] == "-" || query[query.length - 1] == "+") query = query.slice(0, query.length - 1);

		if (query.replace(/[- +*]/g, "") == "") return [] as SearchItem[];

		if (!this._catalogsIndexes[catalogName]) await this._initCatalog(catalogName);
		const result = <SearchItem[]>[];

		this._catalogsIndexes[catalogName]
			// .query((q) => q.term(query, { fields: ["title", "content"] }))
			.search(query)
			.forEach((entry) => {
				if (!ids.some((i) => i == entry.ref)) return;
				const article = this._catalogs[catalogName].find((article) => article.id === entry.ref);
				const paragraph = article.content;
				const searchItem: SearchItem = {
					name: {} as { targets: { start: string; target: string }[]; end: string },
					url: article.logicPath,
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

		return result;
	}

	private async _initCatalog(catalogName: string) {
		let datas: IndexData[] = [];
		if (await this._cache.exists(catalogName)) {
			datas = JSON.parse(await this._cache.get(catalogName));
		} else {
			datas = await this._getIndexDatas(catalogName);
			await this._cache.set(catalogName, JSON.stringify(datas));
		}
		this._catalogs[catalogName] = datas;
		this._createIdx(catalogName);
	}

	private _createIdx(catalogName: string) {
		const datas = this._catalogs[catalogName];
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
			Array.from(datas).forEach((data) => {
				this.add(data);
			});
		});
	}

	private async _getIndexDatas(catalogName: string): Promise<IndexData[]> {
		const datas: IndexData[] = [];
		const catalog = await this._lib.get(catalogName);
		for (const article of catalog.getArticles()) {
			const content = htmlToString(await article.getHtmlContent());
			datas.push({
				title: article.getProp("title"),
				id: article.id,
				// logicPath: await catalog.getPathname(article),
				logicPath: "",
				content: content ?? "",
			});
		}

		return datas;
	}

	private async _resetCatalog(catalogName: string) {
		delete this._catalogs[catalogName];
		delete this._catalogsIndexes[catalogName];
		await this._cache.set(catalogName, JSON.stringify(await this._getIndexDatas(catalogName)));
		await this._initCatalog(catalogName);
	}

	private _getOnUpdate() {
		return async (change: PChangeCatalog): Promise<void> => {
			await this._resetCatalog(change.catalog.getName());
		};
	}
}
