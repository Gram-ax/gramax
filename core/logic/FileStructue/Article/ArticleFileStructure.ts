import Path from "@core/FileProvider/Path/Path";
import FileInfo from "@core/FileProvider/model/FileInfo";
import { Article } from "@core/FileStructue/Article/Article";
import { CatalogErrors } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { FSProps } from "@core/FileStructue/FileStructure";

interface ArticleFileStructure {
	makeArticleByProps(
		path: Path,
		props: FSProps,
		content: string,
		parent: Category,
		catalogProps: FSProps,
		lastModified: number,
	): Article;

	setArticlePath(article: Article, path: Path): Promise<void>;

	saveArticle(article: Article): Promise<FileInfo>;

	createArticle(path: Path, parent: Category, props?: FSProps, errors?: CatalogErrors): Promise<Article>;
}

export default ArticleFileStructure;
