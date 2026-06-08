import type { Token } from "@ext/markdown/core/render/logic/Markdoc";
import tableTransform from "../tableTransform";
import data from "./tableTransformData.json";

describe("tableTransform", () => {
	const transform = (tokens: Token[]) => tableTransform({ tokens: [...tokens] });

	describe("simple table", () => {
		test("as primitive", () => {
			const { input, output } = data.simple_table.simple;
			const result = transform(input as Token[]);
			expect(result).toEqual(output);
		});
		test("as tokens", () => {
			const { input, output } = data.simple_table.as_tokens;
			const result = transform(input as Token[]);
			expect(result).toEqual(output);
		});
		test("as list", () => {
			const { input, output } = data.simple_table.as_list;
			const result = transform(input as Token[]);
			expect(result).toEqual(output);
		});
	});

	describe("table with colwidth", () => {
		test("as tokens", () => {
			const { input, output } = data.table_with_colwidth.as_tokens;
			const result = transform(input as Token[]);
			expect(result).toEqual(output);
		});
		test("as list", () => {
			const { input, output } = data.table_with_colwidth.as_list;
			const result = transform(input as Token[]);
			expect(result).toEqual(output);
		});
	});

	describe("table with colwidths colspans rowsapns ", () => {
		test("as tokens", () => {
			const { input, output } = data.table_with_colwidths_colspans_rowsapns.as_tokens;
			const result = transform(input as Token[]);
			expect(result).toEqual(output);
		});
		test("as list", () => {
			const { input, output } = data.table_with_colwidths_colspans_rowsapns.as_list;
			const result = transform(input as Token[]);
			expect(result).toEqual(output);
		});
	});
});
