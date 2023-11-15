import data from "./testDate.json";
import Transformer from "./Transformer";

const transformer = new Transformer();

describe("Transformer корректно трансформирует токены", () => {
	test("таблицы", () => {
		const tokens: any[] = data.tokens;
		const transformedTkens: any[] = data.transformedTkens;

		const testTransformedTkens = transformer.tableTransform(tokens);

		expect(testTransformedTkens).toEqual(transformedTkens);
	});
});
