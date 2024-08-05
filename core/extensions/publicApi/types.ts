export type CatalogRef = {
	id: string;
	title: string;
};

export type CatalogList = {
	data: CatalogRef[];
};

export type ArticleRef = {
	id: string;
	title: string;
	children?: ArticleRef[];
};

export type CatalogNavigation = {
	data: ArticleRef[];
};
