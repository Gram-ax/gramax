import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog, CatalogErrors } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { FSProps } from "@core/FileStructue/FileStructure";

interface CatalogFileStructure {
	getCatalogByPath(path: Path): Promise<Catalog>;
	saveCatalog(catalog: Catalog): Promise<void>;
	createArticle(path: Path, parent: Category, props?: FSProps, errors?: CatalogErrors): Promise<Article>;
	createCategory(
		path: Path,
		parent: Category,
		article: Article,
		props?: FSProps,
		errors?: CatalogErrors,
	): Promise<Category>;
}

export default CatalogFileStructure;
