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
import { getDescendantAccessibleArticleIds } from "@ext/serach/utils/getDescendantArticleIds";
import { getRestrictedArticleIds } from "@ext/serach/utils/getRestrictedArticleIds";
import { Command } from "../../types/Command";

const chat: Command<
	{
		ctx: Context;
		query: string;
		signal?: AbortSignal;
		catalogName?: string;
		articlesLanguage?: ArticleLanguage;
		responseLanguage?: ContentLanguage;
		articleRefFilter?: string;
		currentArticle: Path;
		catalogNames?: string[];
	},
	{ mime: string; iterator: AsyncGenerator<string, void, void> }
> = Command.create({
	path: "search/chat",

	kind: ResponseKind.stream,

	async do({
		ctx,
		query,
		catalogName,
		articlesLanguage,
		responseLanguage,
		signal,
		currentArticle,
		articleRefFilter,
		catalogNames: initialCatalogNames,
	}) {
		const wm = this._app.wm.current();

		let propertyFilter: PropertyFilter | undefined;
		let restrictedRefPaths: string[] | undefined;
		let articleRefPaths: string[] | undefined;
		let catalogNames: string[] | undefined;
		if (catalogName) {
			const catalog = await wm.getContextlessCatalog(catalogName);
			const catalogAccessible = catalog && SecurityRules.canReadCatalog(ctx.user, catalog.perms, catalog.name);

			if (catalogAccessible) {
				propertyFilter = getCatalogPropertyFilter(catalog);
				if (articleRefFilter) {
					// If articleRefFilter is provided, then we filter only this article and its descendant articles
					articleRefPaths = await getDescendantAccessibleArticleIds(ctx, catalog, articleRefFilter);
				} else {
					restrictedRefPaths = await getRestrictedArticleIds(
						wm,
						[BaseCatalog.parseName(catalogName).name],
						ctx,
					);
					catalogNames = [catalogName];
				}
			} else {
				// Catalog is not accessible
				//   empty catalogNames will not match anything
				//   ChatBot will respond something like "Unable to find info about ..."
				catalogNames = [];
			}
		} else {
			const allCatalogEntries = wm.getAllCatalogs();
			const catalogEntries = initialCatalogNames
				? initialCatalogNames.map((name) => allCatalogEntries.get(name))
				: allCatalogEntries.values();
			catalogNames = getAccessibleCatalogs(ctx.user, catalogEntries).map((x) => x.name);
			restrictedRefPaths = await getRestrictedArticleIds(wm, catalogNames, ctx);
		}

		const generator = await this._app.searcherManager.getChatBotSearcher().search({
			query,
			catalogNames,
			articlesLanguage,
			responseLanguage,
			restrictedRefPaths,
			articleRefPaths,
			propertyFilter,
			stream: true,
			signal,
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

	params(ctx, q, body, signal) {
		return {
			ctx,
			signal,
			query: q.query,
			catalogName: q.catalogName,
			articlesLanguage: isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined,
			responseLanguage: q.responseLanguage ? ContentLanguage[q.responseLanguage] : undefined,
			articleRefFilter: q.articleRefFilter,
			currentArticle: new Path(q.currentArticle),
			catalogNames: body?.catalogNames,
		};
	},
});

export default chat;
