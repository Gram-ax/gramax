import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { ContentLanguage } from "@ext/localization/core/model/Language";

export const catalogHasItems = (catalog: ReadonlyCatalog, currentLanguage: ContentLanguage) => {
	if (currentLanguage && catalog.props.language && catalog.props.language != currentLanguage) {
		const languageCategory = resolveRootCategory(catalog, catalog.props, currentLanguage);
		return languageCategory?.items.length > 0 || false;
	}

	if (!catalog.props.language) {
		return catalog.getRootCategory().items.length > 0;
	}

	return catalog.getRootCategory().items.filter((i) => !isLanguageCategory(catalog, i)).length > 0;
};

export const resolveRootCategory = (
	catalog: ReadonlyCatalog,
  props: CatalogProps,
	currentLanguage: ContentLanguage,
): Category<CatalogProps> => {
	if (!props.language || !currentLanguage || props.language == currentLanguage)
		return catalog.getRootCategory();
	return catalog.findArticle(`${catalog.name}/${currentLanguage}`, [
		(i) => i.type == ItemType.category,
	]) as Category<CatalogProps>;
};

export const isLanguageCategory = (catalog: ReadonlyCatalog, item: Item) =>
	item &&
	item.type == ItemType.category &&
	catalog.props.supportedLanguages.includes(ContentLanguage[item.getFileName()]);
