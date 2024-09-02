import ArticleType from "@core/Plugin/model/ArticleType";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export { ArticleType, FileStatus };

interface ArticleProps {
	tags?: string[];
	title?: string;
}

export interface PArticle {
	id: string;
	type: ArticleType.article;
	parent: PCategory;
	rawMdContent: string;
	getHtmlContent: () => Promise<string>;
	getProp<T extends keyof ArticleProps>(propName: T): ArticleProps[T];
	getPathname: () => Promise<string>;
}

export interface PCategory extends Omit<PArticle, "type"> {
	articles: PArticle[];
	type: ArticleType.category;
}

export interface PCatalog {
	getName(): string;
	getArticles(): PArticle[];
	getArticleById(id: string): PArticle;
	getPathname: () => Promise<string>;
}

export interface PChangeCatalog {
	catalog: PCatalog;
	items: { articleId: string; status: FileStatus }[];
}

export interface PStorage {
	get(key: string): Promise<string>;
	set(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
}

export interface PCatalogs {
	get(name: string): Promise<PCatalog>;
	getAll(): Promise<PCatalog[]>;
	onUpdate(callback: (catalogChanges: PChangeCatalog) => void | Promise<void>): void;
}

export interface PApplication {
	catalogs: PCatalogs;
	storage: PStorage;
}
