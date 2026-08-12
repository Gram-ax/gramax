import { ItemType } from "@core/FileStructue/Item/ItemType";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import SitePresenter from "./SitePresenter";

// Reproduces the multilingual crash class behind GitHub #177: when the requested
// non-default language subtree cannot be resolved (e.g. a broken/missing default
// article leaves the `<catalog>/<lang>` category unbuilt), `resolveRootCategory`
// returns undefined and `getArticleByPathOfCatalog` dereferences it unguarded
// (`!root.parent`) -> TypeError. Every other consumer of `resolveRootCategory`
// guards the nullable result (`?.` / `if (!root) return`); this one did not.

const CATALOG_NAME = "test-catalog";

const makeCatalog = () => {
	const rootCategory = { parent: undefined, items: [], props: {} };
	const article = {
		type: ItemType.article,
		logicPath: `${CATALOG_NAME}/en/article`,
		props: {},
	};

	const catalog = {
		name: CATALOG_NAME,
		props: {
			language: ContentLanguage.ru,
			supportedLanguages: [ContentLanguage.ru, ContentLanguage.en],
			resolvedView: null,
		},
		getRootCategory: () => rootCategory,
		findArticle: (logicPath: string) => {
			// The language-category lookup (`<catalog>/<lang>`) cannot be resolved.
			if (logicPath === `${CATALOG_NAME}/en`) return undefined;
			return article;
		},
	};

	return { catalog, article, rootCategory };
};

const makePresenter = (catalog: unknown): SitePresenter => {
	const sp = Object.create(SitePresenter.prototype);
	sp._workspace = { getCatalog: async () => catalog };
	sp._context = { contentLanguage: ContentLanguage.en };
	sp._filters = [];
	return sp;
};

describe("SitePresenter.getArticleByPathOfCatalog", () => {
	test("degrades gracefully when the language category is unresolvable (#177)", async () => {
		const { catalog, article } = makeCatalog();
		const sp = makePresenter(catalog);

		const result = await sp.getArticleByPathOfCatalog([CATALOG_NAME, "en", "article"]);

		expect(result.catalog).toBe(catalog);
		expect(result.article).toBe(article);
	});
});
