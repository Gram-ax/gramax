import { Article } from "@core/FileStructue/Article/Article";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { NGramIndex } from "@ext/serach/modulith/keyPhrase/NGramIndex";

export interface KeyPhraseArticleSearcherItem {
	id: string;
	catalog: ReadonlyCatalog;
	article: Article;
}

export class KeyPhraseArticleSearcher {
	private index = new NGramIndex<KeyPhraseArticleSearcherItem>(3);

	updateArticle(item: KeyPhraseArticleSearcherItem): void {
		this.index.setTexts(item, item?.article?.props?.searchPhrases ?? []);
	}

	search(query: string): KeyPhraseArticleSearcherItem[] {
		return this.index.search(query);
	}
}
