import { ArticleFragmentCounter, SearchFragmentInfo } from "./ArticleFragmentCounter";

describe("ArticleFragmentCounter", () => {
	it("should return link info for multiple calls with same text fragment", () => {
		const articleFragmentCounter = new ArticleFragmentCounter();
		const text = "test";

		const indexInArticle = articleFragmentCounter.initFragmentInfo(text);
		expect(indexInArticle).toEqual(<SearchFragmentInfo>{ text: "test", indexInArticle: 0 });

		const indexInArticle2 = articleFragmentCounter.initFragmentInfo(text);
		expect(indexInArticle2).toEqual(<SearchFragmentInfo>{ text: "test", indexInArticle: 1 });

		const indexInArticle3 = articleFragmentCounter.initFragmentInfo(text);
		expect(indexInArticle3).toEqual(<SearchFragmentInfo>{ text: "test", indexInArticle: 2 });
	});

	it("should return link info for multiple calls with different text fragments", () => {
		const articleFragmentCounter = new ArticleFragmentCounter();

		const text1 = "test1";
		const text2 = "test2";

		const indexInArticle1 = articleFragmentCounter.initFragmentInfo(text1);
		expect(indexInArticle1).toEqual(<SearchFragmentInfo>{ text: "test1", indexInArticle: 0 });

		const indexInArticle2 = articleFragmentCounter.initFragmentInfo(text2);
		expect(indexInArticle2).toEqual(<SearchFragmentInfo>{ text: "test2", indexInArticle: 0 });

		const indexInArticle3 = articleFragmentCounter.initFragmentInfo(text1);
		expect(indexInArticle3).toEqual(<SearchFragmentInfo>{ text: "test1", indexInArticle: 1 });

		const indexInArticle4 = articleFragmentCounter.initFragmentInfo(text2);
		expect(indexInArticle4).toEqual(<SearchFragmentInfo>{ text: "test2", indexInArticle: 1 });
	});

	it("should handle text fragments that includes another text fragment", () => {
		const articleFragmentCounter = new ArticleFragmentCounter();
		const textBig = "Для того, чтобы поднять инстанс MDT";
		const textSmall = "поднять инстанс";

		const indexInArticleBig = articleFragmentCounter.initFragmentInfo(textBig);
		expect(indexInArticleBig).toEqual(<SearchFragmentInfo>{ text: textBig, indexInArticle: 0 });

		const indexInArticleSmall = articleFragmentCounter.initFragmentInfo(textSmall);
		expect(indexInArticleSmall).toEqual(<SearchFragmentInfo>{ text: textSmall, indexInArticle: 1 });

		const indexInArticleBig2 = articleFragmentCounter.initFragmentInfo(textBig);
		expect(indexInArticleBig2).toEqual(<SearchFragmentInfo>{ text: textBig, indexInArticle: 1 });

		const indexInArticleSmall2 = articleFragmentCounter.initFragmentInfo(textSmall);
		expect(indexInArticleSmall2).toEqual(<SearchFragmentInfo>{ text: textSmall, indexInArticle: 3 });
	});

	it("should handle text fragments that includes another text fragment (other order)", () => {
		const articleFragmentCounter = new ArticleFragmentCounter();
		const textBig = "Для того, чтобы поднять инстанс MDT";
		const textSmall = "поднять инстанс";

		const indexInArticleSmall = articleFragmentCounter.initFragmentInfo(textSmall);
		expect(indexInArticleSmall).toEqual(<SearchFragmentInfo>{ text: textSmall, indexInArticle: 0 });

		const indexInArticleBig = articleFragmentCounter.initFragmentInfo(textBig);
		expect(indexInArticleBig).toEqual(<SearchFragmentInfo>{ text: textBig, indexInArticle: 0 });

		const indexInArticleBig2 = articleFragmentCounter.initFragmentInfo(textBig);
		expect(indexInArticleBig2).toEqual(<SearchFragmentInfo>{ text: textBig, indexInArticle: 1 });

		const indexInArticleSmall2 = articleFragmentCounter.initFragmentInfo(textSmall);
		expect(indexInArticleSmall2).toEqual(<SearchFragmentInfo>{ text: textSmall, indexInArticle: 3 });
	});
});
