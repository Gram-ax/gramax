import { getTableSizes } from "@ext/markdown/elements/table/edit/logic/utils";

const tableFrom = (innerHTML: string): HTMLTableElement => {
	const table = document.createElement("table");
	table.innerHTML = innerHTML;
	return table;
};

describe("getTableSizes", () => {
	test("returns empty sizes for a table whose body has no data cell (only th)", () => {
		// A header-only / freshly-inserted table has a <tbody> but no <td> yet.
		// getCellContainer(tableBody) then does querySelector("td") -> null,
		// and reading .parentElement of null throws inside the ResizeObserver
		// callback (Bugsnag 6a4f419a).
		const table = tableFrom("<tbody><tr><th>Header</th></tr></tbody>");

		expect(() => getTableSizes(table)).not.toThrow();
		expect(getTableSizes(table)).toEqual({ cols: [], rowIndexes: [], rows: [] });
	});

	test("still measures a normal table with data cells", () => {
		const table = tableFrom("<tbody><tr><td>a</td><td>b</td></tr></tbody>");

		const { cols, rows } = getTableSizes(table);
		expect(cols).toHaveLength(2);
		expect(rows).toHaveLength(1);
	});
});
