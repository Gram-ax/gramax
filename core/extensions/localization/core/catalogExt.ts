import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { ContentLanguage } from "@ext/localization/core/model/Language";

export const catalogHasItems = (catalog: Catalog, currentLanguage: ContentLanguage) => {
	if (currentLanguage && catalog.props.language && catalog.props.language != currentLanguage) {
		const languageCategory = resolveRootCategory(catalog, currentLanguage);
		return languageCategory?.items.length > 0 || false;
	}

	if (!catalog.props.language) {
		return catalog.getRootCategory().items.length > 0;
	}

	return catalog.getRootCategory().items.filter((i) => !isLanguageCategory(catalog, i)).length > 0;
};

export const resolveRootCategory = (catalog: Catalog, currentLanguage: ContentLanguage): Category => {
	if (!catalog.props.language || !currentLanguage || catalog.props.language == currentLanguage)
		return catalog.getRootCategory();
	return catalog.findArticle(`${catalog.getName()}/${currentLanguage}`, [
		(i) => i.type == ItemType.category,
	]) as Category;
};

export const isLanguageCategory = (catalog: Catalog, item: Item) =>
	item &&
	item.type == ItemType.category &&
	catalog.props.supportedLanguages.includes(ContentLanguage[item.getFileName()]);
