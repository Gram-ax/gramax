import {
	getAggregatedValue,
	getFormattedValue,
	getFormatter,
} from "@ext/markdown/elements/table/edit/logic/aggregation";
import { AggregationMethod } from "@ext/markdown/elements/table/edit/model/tableTypes";

describe("Table aggregation", () => {
	const formatter = getFormatter();
	const expectedResult = {
		[AggregationMethod.MIN]: "-45,464.45",
		[AggregationMethod.MAX]: "8,563.46",
		[AggregationMethod.AVG]: "-5,828.52",
		[AggregationMethod.SUM]: "-23,314.09",
		[AggregationMethod.COUNT]: "7",
		[AggregationMethod.COUNT_DISTINCT]: "6",
	};
	const testData = ["-45464.45", "8563.46", "8 341,45", "5245,45", "test", "test1", "test1"];

	for (const name in AggregationMethod) {
		const realName = AggregationMethod[name];
		test(`${realName}`, () => {
			const result = getFormattedValue(formatter, getAggregatedValue(realName, testData));
			expect(result).toBe(expectedResult[realName]);
		});
	}
});
