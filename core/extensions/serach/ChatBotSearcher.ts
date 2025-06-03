import { Article } from "@core/FileStructue/Article/Article";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { ArticleLanguage } from "@ext/serach/vector/VectorArticle";

export interface ChatBotSearchOptions {
	query: string;
	catalogName: string;
	articlesLanguage: ArticleLanguage;
	responseLanguage: ContentLanguage;
}

export default interface ChatBotSearcher {
	search(options: ChatBotSearchOptions): Promise<ChatBotSearchItem[]>;
}

export interface ChatBotSearchTextItem {
	type: "text";
	text: string;
}

export interface ChatBotSearchArticleRefItem {
	type: "articleRef";
	article: Article; 
}

export type ChatBotSearchItem = ChatBotSearchTextItem | ChatBotSearchArticleRefItem