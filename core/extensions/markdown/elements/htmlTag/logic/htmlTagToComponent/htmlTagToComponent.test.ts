import HtmlTagToComponent from "./htmlTagToComponent";
import testData from "./testData.json";

describe("HtmlTagToComponent", () => {
	Object.entries(testData).forEach(([tag, { input, output }]) => {
		test(`корректно преобразовывает тег <${tag}>`, () => {
			const transformedNode = HtmlTagToComponent[tag](input);
			expect(transformedNode).toEqual(output);
		});
	});
});
