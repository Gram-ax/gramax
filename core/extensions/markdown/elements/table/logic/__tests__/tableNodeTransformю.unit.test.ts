import tableNodeTransform from "../tableNodeTransform";
import data from "./tableNodeTransformюData.json";

describe("tableTransform", () => {
	test("simple table", async () => {
		const { input } = data.simple_table;
		const result = await tableNodeTransform(input);

		expect(result.isSet).toEqual(false);
	});

	test("table with colspap or rowspan", () => {
		const { input, output } = data.table_with_colspap_or_rowspan;
		const result = tableNodeTransform(input);

		expect(result).toEqual(output);
	});

	test("table with filter and sort", () => {
		const { input, output } = data.table_with_filter_and_sort;
		const result = tableNodeTransform(input);

		expect(result).toEqual(output);
	});
});
