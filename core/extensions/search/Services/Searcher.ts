import hash from "object-hash";
import { Catalog } from "../../../logic/FileStructue/Catalog/Catalog";
import Library from "../../../logic/Library/Library";
import Searcher, { SearchItem } from "../Searcher";
import SaveServiseData from "./models/Data";

import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { Article } from "../../../logic/FileStructue/Article/Article";
import { ItemRef } from "../../../logic/FileStructue/Item/Item";
import { FileStatus } from "../../Watchers/model/FileStatus";
import MarkdownParser from "../../markdown/core/Parser/Parser";
import ParserContextFactory from "../../markdown/core/Parser/ParserContext/ParserContextFactory";
import searchUtils from "../searchUtils";
import Connection, { ResponseData } from "./Connection/Connection";

export default class ServicesSearcher implements Searcher {
	private _tag = "-query_";
	constructor(
		private _lib: Library,
		private _connection: Connection,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
	) {
		this._lib.addOnChangeRule(this._getOnChangeRule());
	}

	async resetAllCatalogs(): Promise<void> {
		let resetDataFlag = true;
		const catalogs: CatalogEntry[] = Array.from(this._lib.getCatalogEntries().values());
		const serviseDatas: SaveServiseData[] = (
			await Promise.all(
				catalogs.map(async (entry) => {
					const catalog = await entry.load();
					return await Promise.all(
						catalog
							.getContentItems()
							.map(async (article) => await this._getArticleData(article, await entry.load())),
					);
				}),
			)
		).reduce((p, c) => p.concat(c));
		if (serviseDatas && resetDataFlag) {
			resetDataFlag = false;
			await this._connection.resetData(serviseDatas);
		}
	}

	async searchAll(query: string, catalogsItemRefs: { [catalogName: string]: ItemRef[] }): Promise<SearchItem[]> {
		let itemRefs: ItemRef[] = [];
		Object.keys(catalogsItemRefs).forEach((catalogName) => {
			itemRefs = itemRefs.concat(catalogsItemRefs[catalogName]);
		});
		return await this.search(query, "", itemRefs);
	}

	async search(query: string, catalogName: string, itemRefs: ItemRef[]): Promise<SearchItem[]> {
		const filters = itemRefs.map((ref) => `${hash(ref)}`);
		const data = await this._connection.getSearchData(query, [], this._tag);
		data.hits = data.hits.filter((hit) => filters.some((id) => id === hit.objectID));
		return this._getSearchItems(data, this._tag);
	}

	_getSearchItems(data: ResponseData<SaveServiseData>, tag: string): SearchItem[] {
		return data.hits.map((hit) => {
			const titleMatches = this._getMatches(hit._snippetResult.title.value, tag);
			const bodyMatches = this._getMatches(hit._snippetResult.body.value, tag);
			const res = {
				name: {
					targets: titleMatches.map((m) => ({
						start: m?.[1] ? m[1] : "",
						target: m?.[2],
					})),
					end: titleMatches.length
						? titleMatches?.[titleMatches.length - 1]?.[3]
						: hit._snippetResult.title.value,
				},
				url: hit.logicPath,
				paragraph: bodyMatches.map((m) => ({
					prev: m?.[1] ? m[1] : "",
					target: m?.[2],
					next: m?.[3] ? m[3] : "",
				})),
				count: bodyMatches ? bodyMatches.length : 0,
				score: 1,
			};
			return res;
		});
	}

	private _getOnChangeRule() {
		return async (changeItems: { catalog: Catalog; itemRef: ItemRef; type: FileStatus }[]): Promise<void> => {
			const deleteObjectIDs: string[] = changeItems
				.filter((changeItem) => changeItem.type === FileStatus.delete)
				.map((changeItem) => hash(changeItem.itemRef));
			await this._connection.deleteData(deleteObjectIDs);
			const algoliaDatas: SaveServiseData[] = (
				await Promise.all(
					changeItems.map(async (changeItem) => {
						const article = changeItem.catalog.findArticleByItemRef(changeItem.itemRef);
						if (!article) return null;
						else return await this._getArticleData(article, changeItem.catalog);
					}),
				)
			).filter((article) => article);
			await this._connection.setData(algoliaDatas);
		};
	}

	private async _getArticleData(article: Article, catalog: Catalog): Promise<SaveServiseData> {
		const body = await searchUtils.getIndexContent(catalog, article, this._parser, this._parserContextFactory);
		return {
			objectID: hash(article.ref),
			logicPath: article.logicPath,
			title: article.props["title"] ?? "",
			body: body ?? "",
		};
	}

	private _getMatches(value: string, tag: string): RegExpExecArray[] {
		const execRegex = new RegExp(`(.*)<${tag}>(.*?)</${tag}>(.*)`);
		const replaceRegex = new RegExp(`([\\s\\S]*?(?=<))<${tag}>([\\s\\S]*?)<\\/${tag}>`);
		const endRegex = new RegExp(`([\\s\\S]*?(?=<))<${tag}>([\\s\\S]*?)<\\/${tag}>(([\\s\\S]*?(?=<))|[\\s\\S]*)`);
		const founds: string[] = [];
		do {
			let exec = replaceRegex.exec(value);
			const replace = value.replace(endRegex, "");
			if (replace) value = value.replace(replaceRegex, "");
			else {
				exec = endRegex.exec(value);
				value = replace;
			}
			if (exec) founds.push(exec[0]);
			else value = "";
		} while (value !== "");
		return founds.map((s) => execRegex.exec(s));
	}
}
