import type { SortRecord } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { getRowMoves } from "@ext/markdown/elements/table/render/logic/sortFilterUtilsRender";
import data from "./data.json";

describe("test sortFilterUtils", () => {
	test("getRowMoves", () => {
		const { input, output } = data.getTableData;
		const { activeSort, sortingOrder, tableData } = input;

		const moves = getRowMoves(tableData, activeSort as SortRecord, sortingOrder);

		expect(moves).toEqual(output);
	});
});
