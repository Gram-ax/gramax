import Path from "@core/FileProvider/Path/Path";
import ArticleFileStructure from "@core/FileStructue/Article/ArticleFileStructure";
import { CatalogErrors } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { FSProps } from "@core/FileStructue/FileStructure";

interface CategoryFileStructure extends ArticleFileStructure {
	makeCategory(
		path: Path,
		parent: Category,
		props: FSProps,
		errors: CatalogErrors,
		indexPath: Path,
	): Promise<Category>;

	setCategoryPath(category: Category, path: Path): Promise<void>;
}

export default CategoryFileStructure;
