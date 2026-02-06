import linkTransformer from "../linkReplacer";
import expectedData from "./replaceLinkTestData/linkTransformerExpectedData.json";
import testData from "./replaceLinkTestData/linkTransformerTestData.json";

describe("LinkTransformer", () => {
	describe("трансформирует ссылки в относительные пути", () => {
		test("трансформирует все ссылки в коллекции статей", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const transformedArticles = linkTransformer.transformLinks(articles);

			expect(transformedArticles).toEqual(expectedData);
		});

		test("трансформирует ссылки из корневой статьи с дочерними", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const rootArticle = articles["48057398"];

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(rootArticle, articles);

			expect(transformedArticle.content).toContain("[Sed imperdiet](./_index)");
			expect(transformedArticle.content).toContain("[Lorem ipsum](./child-1/_index)");
			expect(transformedArticle.content).toContain("[dolor sit](./child-2)");
			expect(transformedArticle.content).toContain("[Morbi vestibulum](./child-1/child-3/_index)");
			expect(transformedArticle.content).toContain("[arcu](./child-1/child-3/child-4)");
		});

		test("трансформирует ссылки из статьи среднего уровня с дочерними", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const child1Article = articles["48057874"];

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(child1Article, articles);

			expect(transformedArticle.content).toContain("[Link to root](../_index)");
			expect(transformedArticle.content).toContain("[Link to child-2](../child-2)");
			expect(transformedArticle.content).toContain("[Link to child-3](./child-3/_index)");
		});

		test("трансформирует ссылки из статьи без дочерних на том же уровне", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const child2Article = articles["48057875"];

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(child2Article, articles);

			expect(transformedArticle.content).toContain("[Back to root](./_index)");
			expect(transformedArticle.content).toContain("[To sibling child-1](./child-1/_index)");
		});

		test("трансформирует ссылки из глубоко вложенной статьи без дочерних", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const child4Article = articles["48057878"];

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(child4Article, articles);

			expect(transformedArticle.content).toContain("[Sed imperdiet](../../_index)");
			expect(transformedArticle.content).toContain("[Lorem ipsum](../_index)");
			expect(transformedArticle.content).toContain("[dolor sit](../../child-2)");
			expect(transformedArticle.content).toContain("[Morbi vestibulum](./_index)");
			expect(transformedArticle.content).toContain("[arcu](./child-4)");
		});

		test("трансформирует ссылки из статьи другого раздела", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const otherSectionArticle = articles["48057900"];

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(otherSectionArticle, articles);

			expect(transformedArticle.content).toContain("[Link to navigation-root](./navigation-root/_index)");
			expect(transformedArticle.content).toContain("[Link to child-2](./navigation-root/child-2)");
		});

		test("сохраняет внешние ссылки без изменений", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const child3Article = articles["48057877"];

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(child3Article, articles);

			expect(transformedArticle.content).toContain("[External link](https://external-site.com/page)");
		});

		test("сохраняет ссылки на несуществующие страницы без изменений", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const child4Article = articles["48057878"];

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(child4Article, articles);

			expect(transformedArticle.content).toContain(
				"[Non-existing link](https://wiki.yandex.ru/non-existing-page/)",
			);
		});

		test("обрабатывает статью без контента", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const emptyArticle = {
				...articles["48057398"],
				content: "",
			};

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(emptyArticle, articles);

			expect(transformedArticle.content).toBe("");
		});

		test("обрабатывает статью с контентом без ссылок", () => {
			const articles = JSON.parse(JSON.stringify(testData));
			const noLinksArticle = {
				...articles["48057398"],
				content: "Just plain text without any links at all.",
			};

			const transformedArticle = linkTransformer.transformLinksForSingleArticle(noLinksArticle, articles);

			expect(transformedArticle.content).toBe("Just plain text without any links at all.");
		});
	});
});
