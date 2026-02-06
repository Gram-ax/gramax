import GXCore from "../../GXCore";
import ResourceReplacer from "../resourceReplacer";
import finishRawData from "./replacerTestData/afterReplacerRawTestData.json";
import finishData from "./replacerTestData/afterReplacerTestData.json";
import data from "./replacerTestData/replacerTestData.json";

describe("Replacer", () => {
	describe("трансформирует в формат", () => {
		const internalTransform = async (raw: boolean) => {
			const articles = JSON.parse(JSON.stringify(data)); // mutable object
			const transformedArticles = raw ? finishRawData : finishData;

			const GxCore = new GXCore();

			GxCore.transformUnsupported(articles, raw);
			GxCore.injectResources(articles, raw);
			GxCore.transformContent(articles, raw);

			expect(articles).toEqual(transformedArticles);
		};

		test('трансформация в формат "gram.ax"', async () => {
			const raw = false;
			await internalTransform(raw);
		});

		test('трансформация в "raw" формате', async () => {
			const raw = true;
			await internalTransform(raw);
		});
	});
	describe("трансформирует картинки", () => {
		test("Старый формат", () => {
			const sourceText = "![Test image](/path/to/image.jpg =400x300)";
			const articleName = "test-article";
			const slug = "test-slug";

			const result = ResourceReplacer.imageReplacer(sourceText, articleName, slug);

			expect(result.content).toBe("![](./test-article-image.jpg){width=400px height=300px}");
			expect(result.resources).toHaveLength(1);
			expect(result.resources[0]).toEqual({
				type: "image",
				slug: "test-slug",
				src: "/path/to/image.jpg",
				status: "open",
				is_replaced: true,
			});
		});

		test("Новый формат", () => {
			const sourceText =
				'![Самоучитель.jpg](/test-page/strange-images/.files/samouchitelpoutx400.jpg "Самоучитель по ЕТ" =x400)';
			const articleName = "test-article";
			const slug = "test-slug";

			const result = ResourceReplacer.imageReplacer(sourceText, articleName, slug);

			expect(result.content).toBe(
				'![](./test-article-samouchitelpoutx400.jpg "Самоучитель по ЕТ"){width=400px height=400px}',
			);
			expect(result.resources).toHaveLength(1);
			expect(result.resources[0]).toEqual({
				type: "image",
				slug: "test-slug",
				src: '/test-page/strange-images/.files/samouchitelpoutx400.jpg "Самоучитель по ЕТ"',
				status: "open",
				is_replaced: true,
			});
		});

		test("Формат только с шириной", () => {
			const sourceText = "![Wide image](/path/to/wide.jpg =500x)";
			const articleName = "article";
			const slug = "slug";

			const result = ResourceReplacer.imageReplacer(sourceText, articleName, slug);

			expect(result.content).toBe("![](./article-wide.jpg){width=500px height=500px}");
			expect(result.resources).toHaveLength(1);
			expect(result.resources[0].src).toBe("/path/to/wide.jpg");
		});

		test("Формат с одним числом", () => {
			const sourceText = "![Square image](/path/to/square.jpg =250x250)";
			const articleName = "my-article";
			const slug = "my-slug";

			const result = ResourceReplacer.imageReplacer(sourceText, articleName, slug);

			expect(result.content).toBe("![](./my-article-square.jpg){width=250px height=250px}");
			expect(result.resources).toHaveLength(1);
		});

		test("Несколько изображений в тексте", () => {
			const sourceText = `
      ![Image 1](/path/img1.jpg =400x300)
      Some text here
      ![Image 2](/path/img2.png =x200)
      More text
      ![Image 3](/path/img3.gif =150x)
    `;
			const articleName = "multi-image";
			const slug = "multi-slug";

			const result = ResourceReplacer.imageReplacer(sourceText, articleName, slug);

			expect(result.resources).toHaveLength(3);
			expect(result.content).toContain("![](./multi-image-img1.jpg){width=400px height=300px}");
			expect(result.content).toContain("![](./multi-image-img2.png){width=200px height=200px}");
			expect(result.content).toContain("![](./multi-image-img3.gif){width=150px height=150px}");
		});

		test("Изображение без размеров остается без изменений", () => {
			const sourceText = "![Regular image](/path/to/regular.jpg)";
			const articleName = "test";
			const slug = "test";

			const result = ResourceReplacer.imageReplacer(sourceText, articleName, slug);

			expect(result.content).toBe("![Regular image](/path/to/regular.jpg)");
			expect(result.resources).toHaveLength(0);
		});
	});
});
