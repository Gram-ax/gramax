import { Article } from "@core/FileStructue/Article/Article";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";

export function getValidCatalogItems(catalog: ReadonlyCatalog): Article[] {
	return catalog.getItems().filter((x) => x.props?.external == null) as Article[];
}
