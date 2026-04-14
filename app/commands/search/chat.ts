import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { getAccessibleCatalogs } from "@ext/security/logic/getAccessibleCatalogs";
import SecurityRules from "@ext/security/logic/SecurityRules";
import { type ArticleLanguage, isArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import type { PropertyFilter } from "@ext/serach/Searcher";
import { makeCitationPlaceholder, type SearchChatStreamItemText } from "@ext/serach/types";
import { getCatalogPropertyFilter } from "@ext/serach/utils/getCatalogPropertyFilter";
import { getRestrictedLogicPaths } from "@ext/serach/utils/getRestrictedLogicPaths";
import { Command } from "../../types/Command";

const chat: Command<
	{
		ctx: Context;
		query: string;
		signal: AbortSignal;
		catalogName?: string;
		articlesLanguage?: ArticleLanguage;
		responseLanguage?: ContentLanguage;
		currentArticle: Path;
	},
	{ mime: string; iterator: AsyncGenerator<string, void, void> }
> = Command.create({
	path: "search/chat",

	kind: ResponseKind.stream,

	async do({ ctx, query, catalogName, articlesLanguage, responseLanguage, signal, currentArticle }) {
		const wm = this._app.wm.current();

		let propertyFilter: PropertyFilter | undefined;
		let catalogNames: string[] = [];
		if (catalogName) {
			const catalog = await wm.getContextlessCatalog(catalogName);
			if (catalog && SecurityRules.canReadCatalog(ctx.user, catalog.perms, catalog.name)) {
				catalogNames = [BaseCatalog.parseName(catalogName).name];
			}

			propertyFilter = getCatalogPropertyFilter(catalog);
		} else {
			const catalogs = wm.getAllCatalogs();
			catalogNames = getAccessibleCatalogs(ctx.user, catalogs.values()).map((x) => x.name);
		}

		const restrictedLogicPaths = await getRestrictedLogicPaths(wm, catalogNames, ctx);

		const generator = await this._app.searcherManager.getChatBotSearcher().search({
			query,
			catalogNames,
			articlesLanguage,
			responseLanguage,
			restrictedLogicPaths,
			propertyFilter,
			stream: true,
			signal: signal,
		});

		const generateNDJsonStream = async function* (): AsyncGenerator<string, void, void> {
			const logicPathToIndex = new Map<string, number>();
			let citationCounter = 0;

			for await (const x of generator) {
				switch (x.type) {
					case "text": {
						yield `${JSON.stringify({ type: "text", text: x.text } satisfies SearchChatStreamItemText)}\n`;
						break;
					}
					case "articleRef": {
						let index = logicPathToIndex.get(x.article.logicPath);
						if (index === undefined) {
							index = ++citationCounter;
							logicPathToIndex.set(x.article.logicPath, index);
						}
						yield `${JSON.stringify({
							type: "text",
							text: makeCitationPlaceholder(
								index,
								x.article.logicPath,
								currentArticle.getRelativePath(x.article.ref.path).value,
							),
						} satisfies SearchChatStreamItemText)}\n`;
						break;
					}
				}
			}
		};

		return {
			mime: "application/x-ndjson",
			iterator: generateNDJsonStream(),
		};
	},

	params(ctx, q, _, signal) {
		return {
			ctx,
			signal,
			query: q.query,
			catalogName: q.catalogName,
			articlesLanguage: isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined,
			responseLanguage: q.responseLanguage ? ContentLanguage[q.responseLanguage] : undefined,
			currentArticle: new Path(q.currentArticle),
		};
	},
});

export default chat;
