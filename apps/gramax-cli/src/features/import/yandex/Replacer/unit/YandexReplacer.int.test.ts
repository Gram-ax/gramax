import GXCore from "../../GXCore";
import data from "./replacerTestData.json";
import finishData from "./afterReplacerTestData.json";
import finishRawData from "./afterReplacerRawTestData.json";

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
});
