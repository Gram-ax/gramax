import lunr from "lunr";
import { ChangeCatalog } from "../../../logic/FileStructue/Catalog/Catalog";
import { ItemRef } from "../../../logic/FileStructue/Item/Item";
import Library from "../../../logic/Library/Library";
import MarkdownParser from "../../markdown/core/Parser/Parser";
import ParserContextFactory from "../../markdown/core/Parser/ParserContext/ParserContextFactory";
import IndexCacheProvider from "../IndexCacheProvider";
import Searcher, { SearchItem } from "../Searcher";
import searchUtils from "../searchUtils";
import customPipeline from "./tokenizer/customPipeline";
import tokenizer from "./tokenizer/tokenizer";

interface IndexData {
	title: string;
	path: string;
	logicPath: string;
	content: string;
	tags: string;
}
export default class LunrSearcher implements Searcher {
	private _catalogs: { [catalogName: string]: IndexData[] } = {};
	private _catalogsIndexes: { [catalogName: string]: lunr.Index } = {};
	private _paragraphOffset = 30;

	constructor(
		private _lib: Library,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _indexCacheProvider: IndexCacheProvider,
	) {
		this._lib.addOnChangeRule(this._getOnChangeRule());
		lunr.Pipeline.registerFunction(customPipeline, "customPipeline");
	}

	resetAllCatalogs() {
		this._catalogs = {};
		this._catalogsIndexes = {};
		return Promise.resolve();
	}

	async searchAll(query: string, itemRefs: { [catalogName: string]: ItemRef[] }): Promise<SearchItem[]> {
		let result: SearchItem[] = [];
		for (const catalogName in itemRefs) {
			result = result.concat(await this.search(query, catalogName, itemRefs[catalogName]));
		}
		return result.sort((a, b) => {
			return a.score < b.score ? 1 : -1;
		});
	}

	async search(query: string, catalogName: string, itemRefs: ItemRef[]): Promise<SearchItem[]> {
		query = query.replace(/ *-[- +]*/g, " -").replace(/ *\+[- +]*/g, " +");
		if (query[query.length - 1] == "-" || query[query.length - 1] == "+") query = query.slice(0, query.length - 1);

		if (query.replace(/[- +*]/g, "") == "") return [] as SearchItem[];

		if (!this._catalogsIndexes[catalogName]) await this._initCatalog(catalogName);
		const result = <SearchItem[]>[];

		this._catalogsIndexes[catalogName]
			// .query((q) => q.term(query, { fields: ["title", "content"] }))
			.search(query)
			.forEach((entry) => {
				if (!itemRefs.some((r) => r.path.value == entry.ref)) return;
				const article = this._catalogs[catalogName].find((article) => article.path === entry.ref);
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
		if (await this._indexCacheProvider.exists(catalogName)) {
			datas = await this._indexCacheProvider.get(catalogName);
		} else {
			datas = await this._getIndexDatas(catalogName);
			await this._indexCacheProvider.set(catalogName, datas);
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
			this.field("tags", { boost: 8 });

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
		const catalog = await this._lib.getCatalog(catalogName);
		for (const article of catalog.getContentItems()) {
			const content = await searchUtils.getIndexContent(
				catalog,
				article,
				this._parser,
				this._parserContextFactory,
			);
			datas.push({
				title: article.props["title"],
				path: article.ref.path.value,
				logicPath: article.logicPath,
				tags: article.props["tags"]?.join(" "),
				content: content ?? "",
			});
		}

		return datas;
	}

	private async _resetCatalog(catalogName: string) {
		delete this._catalogs[catalogName];
		delete this._catalogsIndexes[catalogName];
		await this._indexCacheProvider.set(catalogName, await this._getIndexDatas(catalogName));
		await this._initCatalog(catalogName);
	}

	private _getOnChangeRule() {
		return async (changeItems: ChangeCatalog[]): Promise<void> => {
			const catalogNames: string[] = [];
			changeItems.forEach((item) => {
				const catalogName = item.catalog.getName();
				if (!catalogNames.includes(catalogName)) catalogNames.push(catalogName);
			});
			await Promise.all(catalogNames.map((catalogName) => this._resetCatalog(catalogName)));
		};
	}
}
