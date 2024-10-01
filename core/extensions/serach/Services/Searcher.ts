import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import hash from "object-hash";
import Searcher, { SearchItem } from "../Searcher";
import Connection, { ResponseData } from "./Connection/Connection";
import SaveServiceData from "./models/Data";

export default class ServicesSearcher implements Searcher {
	private _tag = "-query_";
	constructor(private _wm: WorkspaceManager, private _connection: Connection) {
		// this._catalogs.onUpdate(this._getOnChangeRule().bind(this));
	}

	async resetAllCatalogs(): Promise<void> {
		let resetDataFlag = true;
		const catalogs = await Promise.all(
			Array.from(this._wm.current().getCatalogEntries().values()).map((c) => c.load()),
		);
		const serviseDatas: SaveServiceData[] = (
			await Promise.all(
				catalogs.map(async (catalog) => {
					return await Promise.all(
						catalog.getArticles().map(async (article) => await this._getArticleData(article, catalog)),
					);
				}),
			)
		).reduce((p, c) => p.concat(c));
		if (serviseDatas && resetDataFlag) {
			resetDataFlag = false;
			await this._connection.resetData(serviseDatas);
		}
	}

	async searchAll(query: string, catalogsArticleIds: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		let articleId: string[] = [];
		Object.keys(catalogsArticleIds).forEach((catalogName) => {
			articleId = articleId.concat(catalogsArticleIds[catalogName]);
		});
		return await this.search(query, "", articleId);
	}

	async search(query: string, catalogName: string, articleIds: string[]): Promise<SearchItem[]> {
		const filters = articleIds.map((ref) => `${hash(ref)}`);
		const data = await this._connection.getSearchData(query, [], this._tag);
		data.hits = data.hits.filter((hit) => filters.some((id) => id === hit.objectID));
		return this._getSearchItems(data, this._tag);
	}

	_getSearchItems(data: ResponseData<SaveServiceData>, tag: string): SearchItem[] {
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
		// return async (changeItems: CatalogFilesUpdated): Promise<void> => {
		// 	const deleteObjectIDs: string[] = changeItems.items
		// 		.filter((changeItem) => changeItem.status === ItemRefStatus.delete)
		// 		.map((changeItem) => hash(changeItem.articleId));
		// 	await this._connection.deleteData(deleteObjectIDs);
		// 	const algoliaDatas: SaveServiceData[] = (
		// 		await Promise.all(
		// 			changeItems.items.map(async (changeItem) => {
		// 				const item = changeItems.catalog.getArticleById(changeItem.articleId);
		// 				if (!item || item.type !== ArticleType.article) return null;
		// 				else return await this._getArticleData(item, changeItems.catalog);
		// 			}),
		// 		)
		// 	).filter((article) => article);
		// 	await this._connection.setData(algoliaDatas);
		// };
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private async _getArticleData(article: Article, catalog: Catalog): Promise<SaveServiceData> {
		return Promise.resolve(null);
		// const body = htmlToString(await article.getHtmlContent());
		// return {
		// 	objectID: hash(article.id),
		// 	logicPath: "",
		// 	title: article.getProp("title") ?? "",
		// 	body: body ?? "",
		// };
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
