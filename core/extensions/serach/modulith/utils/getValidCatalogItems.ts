import type { Article } from "@core/FileStructue/Article/Article";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { isRootLanguageCategory } from "@ext/localization/core/catalogExt";

export function getValidCatalogItems(catalog: ReadonlyCatalog): Article[] {
	return catalog
		.getItems()
		.filter((x) => x.props?.external == null && !isRootLanguageCategory(catalog, x)) as Article[];
}
