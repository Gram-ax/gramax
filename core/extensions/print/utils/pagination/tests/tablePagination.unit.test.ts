import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import {
	getRepeatableThead,
	collectBodyRows,
	countTopLevelTableRows,
	paginateTable,
} from "../../../../markdown/elements/table/print/tablePagination";
import { createPage } from "../pageElements";
import { createProgressTracker } from "../progress";

describe("tablePagination", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("clones existing table headers", () => {
		const table = document.createElement("table");
		const thead = document.createElement("thead");
		const row = document.createElement("tr");
		const th = document.createElement("th");
		th.textContent = "Header";
		row.appendChild(th);
		thead.appendChild(row);
		table.appendChild(thead);

		const clone = getRepeatableThead(table);
		expect(clone).not.toBeNull();
		expect(clone).not.toBe(thead);
		expect(clone?.outerHTML).toBe(thead.outerHTML);
	});

	it("creates synthetic header from first body row of th cells", () => {
		const table = document.createElement("table");
		const tbody = document.createElement("tbody");
		const headerRow = document.createElement("tr");
		const th = document.createElement("th");
		th.textContent = "Synthetic";
		headerRow.appendChild(th);
		tbody.appendChild(headerRow);
		table.appendChild(tbody);

		const clone = getRepeatableThead(table);
		expect(clone).not.toBeNull();
		expect(clone?.dataset._synthesized).toBe("1");
		expect(clone?.querySelectorAll("tr")).toHaveLength(1);
	});

	it("skips synthesized header rows when collecting body rows", () => {
		const table = document.createElement("table");
		const tbody = document.createElement("tbody");
		const headerRow = document.createElement("tr");
		headerRow.dataset.repeatHeader = "true";
		const th = document.createElement("th");
		th.textContent = "Header";
		headerRow.appendChild(th);

		const dataRow = document.createElement("tr");
		const td = document.createElement("td");
		td.textContent = "Row 1";
		dataRow.appendChild(td);

		tbody.appendChild(headerRow);
		tbody.appendChild(dataRow);
		table.appendChild(tbody);

		const repeatable = getRepeatableThead(table);
		const rows = collectBodyRows(table, repeatable);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toBe(dataRow);
	});

	it("counts rows of top-level tables", () => {
		const container = document.createElement("div");

		const makeRow = (...texts: string[]) => {
			const row = document.createElement("tr");
			texts.forEach((text) => {
				const cell = document.createElement("td");
				cell.textContent = text;
				row.appendChild(cell);
			});
			return row;
		};

		const tableA = document.createElement("table");
		const tbodyA = document.createElement("tbody");
		tbodyA.appendChild(makeRow("a1"));
		tbodyA.appendChild(makeRow("a2"));
		tableA.appendChild(tbodyA);

		const tableB = document.createElement("table");
		tableB.setAttribute("data-header", "row");
		const tbodyB = document.createElement("tbody");
		const headerLike = makeRow("header");
		const dataRow = makeRow("data");
		tbodyB.appendChild(headerLike);
		tbodyB.appendChild(dataRow);
		tableB.appendChild(tbodyB);

		const mockNodeDimension = {
			get: jest.fn((node) => {
				if (node.tagName === "TR") {
					return { height: 20, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 };
				}
				return { height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 };
			}),
			canUpdateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeight: jest.fn(),
		} as unknown as NodeDimensions;

		container.appendChild(tableA);
		container.appendChild(tableB);
		document.body.appendChild(container);

		expect(countTopLevelTableRows(container, mockNodeDimension)).toBe(3);

		container.remove();
	});

	it("splits oversized tables across pages", async () => {
		const pages = document.createElement("div");
		const firstPage = createPage(pages);
		Object.defineProperty(firstPage, "clientHeight", { value: 100, configurable: true });

		const styleSpy = jest.spyOn(window, "getComputedStyle").mockImplementation(
			() =>
				({
					paddingTop: "0px",
					paddingBottom: "0px",
				} as any),
		);

		const table = document.createElement("table");
		const tbody = document.createElement("tbody");

		const makeRow = (text: string) => {
			const row = document.createElement("tr");
			const cell = document.createElement("td");
			cell.textContent = text;
			row.appendChild(cell);
			return row;
		};

		const rowA = makeRow("row-a");
		const rowB = makeRow("row-b");
		tbody.appendChild(rowA);
		tbody.appendChild(rowB);
		table.appendChild(tbody);

		const mockNodeDimension = {
			get: jest.fn((node) => {
				if (node === rowA)
					return { height: 60, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 };
				if (node === rowB)
					return { height: 60, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 };
				if (node === table)
					return { height: 10, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 };
				return undefined;
			}),
			canUpdateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeight: jest.fn(),
		} as unknown as NodeDimensions;

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({
			totalUnits: 4,
			reporter: jest.fn(),
		});
		const progressSpy = jest.spyOn(progress, "increase");

		const state = {
			currentPage: firstPage,
			fragment: document.createDocumentFragment(),
			accumulatedHeight: { height: 0, marginBottom: 0 },
		};
		const finalPage = await paginateTable(pages, table, state, mockNodeDimension, yieldTick, progress);

		expect(styleSpy).toHaveBeenCalled();
		expect(pages.children).toHaveLength(2);
		expect(finalPage).toBe(pages.children[1].children[1]);

		const firstTable = pages.children[0].querySelectorAll("tbody tr");
		const secondTable = pages.children[1].querySelectorAll("tbody tr");
		expect(firstTable).toHaveLength(1);
		expect(secondTable).toHaveLength(1);

		expect(yieldTick).toHaveBeenCalled();
		expect(progressSpy).toHaveBeenCalled();
	});
});
