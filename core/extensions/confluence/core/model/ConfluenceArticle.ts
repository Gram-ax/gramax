import { JSONContent } from "@tiptap/core";

export interface ConfluenceArticle {
	domain: string;
	id: string;
	linkUi: string;
	position: number;
	title: string;
	content: JSONContent;
	parentId: string | null;
	parentType: string | null;
}
export interface ConfluenceArticleTree extends ConfluenceArticle {
	children: ConfluenceArticleTree[];
}
