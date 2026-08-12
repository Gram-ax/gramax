import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";

// `addExternalItems` builds a translation stub with `title: null` and keeps the source title in
// `props.external`, but `external` is never written to the frontmatter — a published stub is just
// `order` and nothing else. It is also only ever built inside editor flows, so a reader that loads
// the catalog straight from git (docportal, SSR) sees a title-less article, `item-filter` lets it
// through and navigation falls back to the file name.
//
// Recompute the marker from the default-language tree on every catalog read: an item inside a
// language category that carries no title of its own is untranslated, and the counterpart title
// from the default language is what `Item.getTitle()` should show for it.
export const markUntranslatedItems = (catalog: Catalog) => {
	const defaultLanguage = catalog.props.language;
	if (!defaultLanguage) return;

	for (const language of catalog.props.supportedLanguages ?? []) {
		if (language === defaultLanguage) continue;

		const languageCategory = catalog.findArticle(`${catalog.name}/${language}`, [
			(i) => i.type === ItemType.category,
		]) as Category;
		if (!languageCategory) continue;

		markCategory(catalog, languageCategory, `${catalog.name}/${language}`);
	}
};

const markCategory = (catalog: Catalog, category: Category, languageLogicPath: string) => {
	for (const item of category.items) {
		markItem(catalog, item, languageLogicPath);
		if (item.type === ItemType.category) markCategory(catalog, item as Category, languageLogicPath);
	}
};

const markItem = (catalog: Catalog, item: Item, languageLogicPath: string) => {
	// A filled-in title means the item is translated; leave whatever the editor flows put there.
	if (item.props.title?.toString()?.trim()) return;

	// Match by logic path, not file path: they only coincide when the catalog folder is named after
	// the catalog and `.doc-root.yaml` lies at its root (see addExternalItems).
	const ownerLogicPath = `${catalog.name}${item.logicPath.substring(languageLogicPath.length)}`;
	const owner = catalog.findArticle(ownerLogicPath, []);
	if (!owner) return;

	const ownerTitle = owner.props.title?.toString()?.trim();
	if (!ownerTitle) return;

	item.props.external = ownerTitle;
};

export default markUntranslatedItems;
