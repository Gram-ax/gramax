import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { markUntranslatedItems } from "./markUntranslatedItems";

// markUntranslatedItems only reads name/props/items/logicPath and resolves counterparts through
// findArticle, so a flat logic-path index is a faithful stand-in for the catalog tree.
type MockItem = {
	logicPath: string;
	type: ItemType;
	props: { title?: string; external?: string; order?: number };
	items?: MockItem[];
};

const article = (logicPath: string, title?: string): MockItem => ({
	logicPath,
	type: ItemType.article,
	props: title ? { title } : {},
});

const category = (logicPath: string, items: MockItem[], title?: string): MockItem => ({
	logicPath,
	type: ItemType.category,
	props: title ? { title } : {},
	items,
});

const makeCatalog = (name: string, language: string, supportedLanguages: string[], roots: MockItem[]) => {
	const index = new Map<string, MockItem>();
	const add = (item: MockItem) => {
		index.set(item.logicPath, item);
		item.items?.forEach(add);
	};
	roots.forEach(add);

	return {
		name,
		props: { language, supportedLanguages },
		findArticle: (logicPath: string, filters: ((i: Item) => boolean)[]) => {
			const found = index.get(logicPath);
			if (!found) return null;
			return filters.every((f) => f(found as unknown as Item)) ? found : null;
		},
	} as unknown as Catalog;
};

describe("markUntranslatedItems", () => {
	test("помечает статью без заголовка заголовком из основного языка", () => {
		const untranslated = article("docs/en/catalog/migration/yandex-wiki");
		const catalog = makeCatalog(
			"docs",
			"ru",
			["ru", "en"],
			[
				category("docs/en", [
					category("docs/en/catalog", [category("docs/en/catalog/migration", [untranslated])]),
				]),
				category("docs/catalog", [
					category("docs/catalog/migration", [
						article("docs/catalog/migration/yandex-wiki", "Миграция из Yandex Wiki"),
					]),
				]),
			],
		);

		markUntranslatedItems(catalog);

		expect(untranslated.props.external).toBe("Миграция из Yandex Wiki");
	});

	test("не трогает переведённую статью", () => {
		const translated = article("docs/en/catalog/migration/notion", "Migrating from Notion");
		const catalog = makeCatalog(
			"docs",
			"ru",
			["ru", "en"],
			[
				category("docs/en", [
					category("docs/en/catalog", [category("docs/en/catalog/migration", [translated])]),
				]),
				category("docs/catalog", [
					category("docs/catalog/migration", [
						article("docs/catalog/migration/notion", "Миграция из Notion"),
					]),
				]),
			],
		);

		markUntranslatedItems(catalog);

		expect(translated.props.external).toBeUndefined();
	});

	test("не помечает статью, которой нет в основном языке", () => {
		const enOnly = article("docs/en/only-english");
		const catalog = makeCatalog(
			"docs",
			"ru",
			["ru", "en"],
			[category("docs/en", [enOnly]), category("docs/catalog", [])],
		);

		markUntranslatedItems(catalog);

		expect(enOnly.props.external).toBeUndefined();
	});

	test("помечает категорию без заголовка", () => {
		const untranslatedCategory = category("docs/en/catalog", [article("docs/en/catalog/versioning", "Versioning")]);
		const catalog = makeCatalog(
			"docs",
			"ru",
			["ru", "en"],
			[
				category("docs/en", [untranslatedCategory]),
				category("docs/catalog", [article("docs/catalog/versioning", "Версионирование")], "Каталог"),
			],
		);

		markUntranslatedItems(catalog);

		expect(untranslatedCategory.props.external).toBe("Каталог");
	});

	test("ничего не делает для одноязычного каталога", () => {
		const item = article("docs/catalog/versioning");
		const catalog = makeCatalog("docs", null, [], [category("docs/catalog", [item])]);

		markUntranslatedItems(catalog);

		expect(item.props.external).toBeUndefined();
	});
});
