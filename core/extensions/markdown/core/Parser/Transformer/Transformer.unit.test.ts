import htmlTagTransform from "@ext/markdown/elements/htmlTag/logic/htmlTagTransform";
import tableTransform from "@ext/markdown/elements/table/logic/tableTransform";
import data from "./testDate.json";

describe("Transformer корректно трансформирует токены", () => {
	test("tableTransform", () => {
		const tokens: any[] = data.tableTransform.tokens;
		const transformedTkens: any[] = data.tableTransform.transformedTokens;

		const testTransformedTokens = tableTransform(tokens);

		expect(testTransformedTokens).toEqual(transformedTkens);
	});

	describe("htmlTagTransform", () => {
		it("корректно обрабатывает блоки с HTML тегами", () => {
			const tokens: any[] = data.htmlTagTransform.blockHtmlTag.tokens;
			const transformedTkens: any[] = data.htmlTagTransform.blockHtmlTag.transformedTokens;

			const testTransformedTokens = htmlTagTransform(tokens);

			expect(testTransformedTokens).toEqual(transformedTkens);
		});

		it("корректно обрабатывает вложенные HTML теги", () => {
			const tokens: any[] = data.htmlTagTransform.blockWithInlineHtmlTag.tokens;
			const transformedTkens: any[] = data.htmlTagTransform.blockWithInlineHtmlTag.transformedTokens;

			const testTransformedTokens = htmlTagTransform(tokens);

			expect(testTransformedTokens).toEqual(transformedTkens);
		});
	});
});
