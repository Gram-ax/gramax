import { Article } from "@core/FileStructue/Article/Article";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";

export interface SearchArgsBase {
	query: string;
	catalogName: string;
	articlesLanguage: ArticleLanguage;
	responseLanguage: ContentLanguage;
	signal?: AbortSignal;
}

export interface SearchArgs extends SearchArgsBase {
	stream?: false;
}

export interface SearchStreamArgs extends SearchArgsBase {
	stream: true;
}

export default interface ChatBotSearcher {
	search(args: SearchArgs): Promise<ChatBotSearchItem[]>;
	search(args: SearchStreamArgs): Promise<ChatBotSearchStream>;
	search(args: SearchArgs | SearchStreamArgs): Promise<ChatBotSearchItem[] | ChatBotSearchStream>;
}

export interface ChatBotSearchTextItem {
	type: "text";
	text: string;
}

export interface ChatBotSearchArticleRefItem {
	type: "articleRef";
	article: Article;
}

export type ChatBotSearchItem = ChatBotSearchTextItem | ChatBotSearchArticleRefItem;

export type ChatBotSearchStream = AsyncGenerator<ChatBotSearchItem, void, void>;
