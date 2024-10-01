export interface ConfluenceArticle {
	domain: string;
	id: string;
	linkUi: string;
	position?: number;
	title: string;
	content: string;
	parentId?: string;
	parentType?: string;
}
export interface ConfluenceArticleTree extends ConfluenceArticle {
	children: ConfluenceArticleTree[];
}
