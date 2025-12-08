import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { TablePaginator } from "@ext/markdown/elements/table/print/TablePaginator";
import { RowPaginator } from "@ext/markdown/elements/table/print/RowPaginator";
import { ListPaginator } from "@ext/markdown/elements/list/print/ListPaginator";
import { SnippetPaginator } from "@ext/markdown/elements/snippet/print/SnippetPaginator";
import { NotePaginator } from "@ext/markdown/elements/note/print/NotePaginator";
import { TabsPaginator } from "@ext/markdown/elements/tabs/print/TabsPaginator";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { AbortController } from "abort-controller";

jest.mock("@ext/print/utils/pagination/abort", () => ({
	throwIfAborted: jest.fn(),
}));

Object.defineProperty(window, "getComputedStyle", {
	value: jest.fn(() => ({
		paddingTop: "0px",
		paddingBottom: "0px",
		marginTop: "0px",
		marginBottom: "0px",
	})),
});

describe("Paginator System", () => {
	let mockNodeDimensions: jest.Mocked<NodeDimensions>;
	let mockControlInfo: any;
	let mockPaginationInfo: any;
	let mockPrintPageInfo: any;
	let abortController: AbortController;
	let mockPaginator: any;

	beforeEach(() => {
		abortController = new AbortController();

		mockNodeDimensions = {
			get: jest.fn(() => ({
				height: 20,
				marginTop: 0,
				marginBottom: 0,
				paddingH: 5,
			})),
			canUpdateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeightNode: jest.fn(() => ({ height: 20, marginBottom: 0 })),
			updateAccumulatedHeightDim: jest.fn(() => ({ height: 20, marginBottom: 0 })),
		} as any;

		mockControlInfo = {
			signal: abortController.signal,
			progress: { increase: jest.fn() },
			yieldTick: jest.fn().mockResolvedValue(undefined),
		};

		mockPaginationInfo = {
			nodeDimension: mockNodeDimensions,
			accumulatedHeight: { height: 0, marginBottom: 0 },
			printHandlers: {
				required: [],
				conditional: [],
			},
		};

		mockPrintPageInfo = {
			usablePageHeight: 100,
		};

		Paginator.controlInfo = mockControlInfo;
		Paginator.paginationInfo = mockPaginationInfo;
		Paginator.printPageInfo = mockPrintPageInfo;

		mockPaginator = Object.create(Paginator.prototype);
		Object.assign(mockPaginator, {
			currentContainer: document.createElement("div"),
			createPage: jest.fn(() => document.createElement("div")),
			getUsableHeight: jest.fn(() => 100),
		});

		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("TablePaginator", () => {
		it("should create repeatable thead from existing thead", () => {
			const tableWrapper = document.createElement("div");
			const table = document.createElement("table");
			const thead = document.createElement("thead");
			const row = document.createElement("tr");
			const th = document.createElement("th");
			th.textContent = "Header";
			row.appendChild(th);
			thead.appendChild(row);
			table.appendChild(thead);
			tableWrapper.appendChild(table);

			const paginator = new TablePaginator(tableWrapper, {} as any);
			const repeatableThead = paginator["getRepeatableThead"]();

			expect(repeatableThead).not.toBeNull();
			expect(repeatableThead?.tagName).toBe("THEAD");
			expect(repeatableThead?.querySelector("th")?.textContent).toBe("Header");
		});

		it("should create synthetic header from first row when data-header='row'", () => {
			const tableWrapper = document.createElement("div");
			const table = document.createElement("table");
			table.setAttribute("data-header", "row");
			const tbody = document.createElement("tbody");
			const row = document.createElement("tr");
			const td = document.createElement("td");
			td.textContent = "Data";
			row.appendChild(td);
			tbody.appendChild(row);
			table.appendChild(tbody);
			tableWrapper.appendChild(table);

			mockNodeDimensions.get.mockReturnValue({ height: 20, marginTop: 0, marginBottom: 0, paddingH: 0 });

			const paginator = new TablePaginator(tableWrapper, {} as any);
			Paginator.paginationInfo.nodeDimension = mockNodeDimensions;
			const repeatableThead = paginator["getRepeatableThead"]();

			expect(repeatableThead).not.toBeNull();
			expect(repeatableThead?.dataset._synthesized).toBe("from-first-row");
			expect(repeatableThead?.dataset._height).toBe("20");
		});

		it("should create synthetic header from first row of th cells", () => {
			const tableWrapper = document.createElement("div");
			const table = document.createElement("table");
			const tbody = document.createElement("tbody");
			const row = document.createElement("tr");
			const th = document.createElement("th");
			th.textContent = "Header";
			row.appendChild(th);
			tbody.appendChild(row);
			table.appendChild(tbody);
			tableWrapper.appendChild(table);

			mockNodeDimensions.get.mockReturnValue({ height: 20, marginTop: 0, marginBottom: 0, paddingH: 0 });

			const paginator = new TablePaginator(tableWrapper, {} as any);
			const repeatableThead = paginator["getRepeatableThead"]();

			expect(repeatableThead).not.toBeNull();
			expect(repeatableThead?.dataset._synthesized).toBe("1");
			expect(repeatableThead?.dataset._height).toBe("20");
		});

		it("should return null when data-header='column'", () => {
			const tableWrapper = document.createElement("div");
			const table = document.createElement("table");
			table.setAttribute("data-header", "column");
			tableWrapper.appendChild(table);

			const paginator = new TablePaginator(tableWrapper, {} as any);
			const repeatableThead = paginator["getRepeatableThead"]();

			expect(repeatableThead).toBeNull();
		});

		it("should collect body rows excluding synthetic headers", () => {
			const table = document.createElement("table");
			const tbody = document.createElement("tbody");

			const headerRow = document.createElement("tr");
			const th = document.createElement("th");
			th.textContent = "Header";
			headerRow.appendChild(th);
			tbody.appendChild(headerRow);

			const dataRow = document.createElement("tr");
			const td = document.createElement("td");
			td.textContent = "Data";
			dataRow.appendChild(td);
			tbody.appendChild(dataRow);

			table.appendChild(tbody);

			const paginator = new TablePaginator(table, mockPaginator);

			const mockThead = document.createElement("thead");
			const theadRow = document.createElement("tr");
			mockThead.appendChild(theadRow);
			mockThead.dataset._synthesized = "from-first-row";
			paginator["repeatThead"] = mockThead;

			const bodyRows = paginator["collectBodyRows"]();

			expect(bodyRows).toHaveLength(1);
			expect(bodyRows[0]).toBe(dataRow);
		});

		it("should clone table shell with colgroup and thead", () => {
			const tableWrapper = document.createElement("div");
			const table = document.createElement("table");
			const colgroup = document.createElement("colgroup");
			const col = document.createElement("col");
			colgroup.appendChild(col);
			table.appendChild(colgroup);

			const thead = document.createElement("thead");
			const row = document.createElement("tr");
			const th = document.createElement("th");
			th.textContent = "Header";
			row.appendChild(th);
			thead.appendChild(row);
			table.appendChild(thead);
			tableWrapper.appendChild(table);

			const paginator = new TablePaginator(tableWrapper, {} as any);
			paginator["repeatThead"] = thead;

			const { table: clonedTable, tbody } = paginator["cloneTableShell"]();

			expect(clonedTable.tagName).toBe("TABLE");
			expect(clonedTable.querySelector("colgroup")).not.toBeNull();
			expect(clonedTable.querySelector("thead")).not.toBeNull();
			expect(clonedTable.querySelector("tbody")).toBe(tbody);
		});
	});

	describe("RowPaginator", () => {
		it("should paginate oversized row by creating new rows", async () => {
			const row = document.createElement("tr");
			const cell1 = document.createElement("td");
			cell1.textContent = "Cell 1";
			const cell2 = document.createElement("td");
			cell2.textContent = "Cell 2";
			row.appendChild(cell1);
			row.appendChild(cell2);

			const mockParentPaginator = {
				currentContainer: document.createElement("div"),
				createPage: jest.fn(() => document.createElement("div")),
				getUsableHeight: jest.fn(() => 100),
			};

			mockNodeDimensions.get.mockReturnValue({ height: 20, marginTop: 0, marginBottom: 0, paddingH: 10 });

			const paginator = new RowPaginator(row, mockParentPaginator as any);

			await paginator.paginateNode();

			expect(mockParentPaginator.currentContainer.children).toHaveLength(1);
			expect(mockParentPaginator.currentContainer.children[0].tagName).toBe("TR");
		});

		it("should create new row when splitting cells", () => {
			const row = document.createElement("tr");
			const cell = document.createElement("td");
			cell.textContent = "Test";
			row.appendChild(cell);

			const mockParentPaginator = {
				createPage: jest.fn(() => document.createElement("div")),
			};

			const paginator = new RowPaginator(row, mockParentPaginator as any);
			paginator["rows"] = [row];
			paginator["rowIndex"] = 0;
			paginator["cellIndex"] = 0;
			paginator["currentContainer"] = cell;
			paginator["currentTr"] = row;

			const newContainer = paginator.createPage();

			expect(mockParentPaginator.createPage).toHaveBeenCalled();
			expect(paginator["rows"]).toHaveLength(2);
			expect(newContainer).not.toBeNull();
		});

		it("should calculate usable height accounting for cell padding", () => {
			const row = document.createElement("tr");
			const cell = document.createElement("td");
			row.appendChild(cell);

			const mockParentPaginator = {
				getUsableHeight: jest.fn(() => 100),
			};

			mockNodeDimensions.get.mockReturnValue({ height: 20, marginTop: 0, marginBottom: 0, paddingH: 10 });

			const paginator = new RowPaginator(row, mockParentPaginator as any);
			paginator["currentContainer"] = cell;

			const usableHeight = paginator.getUsableHeight();

			expect(mockParentPaginator.getUsableHeight).toHaveBeenCalled();
			expect(usableHeight).toBe(90);
		});
	});

	describe("ListPaginator", () => {
		it("should handle ordered list numbering across pages", async () => {
			const ol = document.createElement("ol");
			const li1 = document.createElement("li");
			li1.textContent = "Item 1";
			const li2 = document.createElement("li");
			li2.textContent = "Item 2";
			ol.appendChild(li1);
			ol.appendChild(li2);

			const listPaginator = new ListPaginator(ol, mockPaginator);

			await listPaginator.paginateNode();

			expect(mockPaginator.currentContainer.children).toHaveLength(1);
		});

		it("should create new list with correct start number on page break", () => {
			const ol = document.createElement("ol");

			const mockParentPaginator = {
				createPage: jest.fn(() => document.createElement("div")),
				currentContainer: {},
			};

			const paginator = new ListPaginator(ol, mockParentPaginator as any);
			paginator["currentStartNumber"] = 3;
			paginator["currentContainer"] = document.createElement("li");

			const newContainer = paginator.createPage();

			expect(mockParentPaginator.createPage).toHaveBeenCalled();
			const newList = mockParentPaginator.createPage.mock.results[0].value.children[0];
			expect(newList.tagName).toBe("OL");
			expect(newList.getAttribute("start")).toBe("3");
		});

		it("should handle task items correctly", () => {
			const ul = document.createElement("ul");
			const taskItem = document.createElement("li");
			taskItem.classList.add("task-item");
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			const content = document.createElement("span");
			content.textContent = "Task";
			taskItem.appendChild(checkbox);
			taskItem.appendChild(content);
			ul.appendChild(taskItem);

			const paginator = new ListPaginator(ul, {} as any);

			const container = paginator["getContainer"](taskItem);

			expect(container).toBe(content);
			expect(paginator["taskItemTemplate"]).not.toBeNull();
		});
	});

	describe("SnippetPaginator", () => {
		it("should clone snippet element and paginate its content", async () => {
			const snippet = document.createElement("div");
			snippet.classList.add("snippet");

			const snippetPaginator = new SnippetPaginator(snippet, mockPaginator);

			await snippetPaginator.paginateNode();

			expect(mockPaginator.currentContainer.children).toHaveLength(1);
			expect(mockPaginator.currentContainer.children[0].classList.contains("snippet")).toBe(true);
		});

		it("should create new page container when content overflows", () => {
			const snippet = document.createElement("div");

			const mockParentPaginator = {
				createPage: jest.fn(() => document.createElement("div")),
				currentContainer: {},
			};

			const paginator = new SnippetPaginator(snippet, mockParentPaginator as any);
			paginator["currentContainer"] = snippet.cloneNode(true) as HTMLDivElement;

			const newContainer = paginator.createPage();

			expect(mockParentPaginator.createPage).toHaveBeenCalled();
			expect(newContainer).not.toBeNull();
		});
	});

	describe("NotePaginator", () => {
		it("should handle note element with admonition structure", async () => {
			const note = document.createElement("div");
			note.classList.add("admonition");

			const heading = document.createElement("div");
			heading.classList.add("admonition-heading");
			heading.textContent = "Note title";
			note.appendChild(heading);

			const content = document.createElement("div");
			content.classList.add("admonition-content");

			const contentInner = document.createElement("div");
			contentInner.textContent = "Note content";
			content.appendChild(contentInner);
			note.appendChild(content);

			const notePaginator = new NotePaginator(note, mockPaginator);

			await notePaginator.paginateNode();

			expect(mockPaginator.currentContainer.children).toHaveLength(1);
		});

		it("should create new page container when content overflows", () => {
			const note = document.createElement("div");
			note.classList.add("admonition");

			const heading = document.createElement("div");
			heading.classList.add("admonition-heading");
			note.appendChild(heading);

			const content = document.createElement("div");
			content.classList.add("admonition-content");
			note.appendChild(content);

			const mockParentPaginator = {
				createPage: jest.fn(() => document.createElement("div")),
				currentContainer: {},
			};

			const paginator = new NotePaginator(note, mockParentPaginator as any);
			paginator["currentContainer"] = content.cloneNode(true) as HTMLDivElement;

			const newContainer = paginator.createPage();

			expect(mockParentPaginator.createPage).toHaveBeenCalled();
			expect(newContainer).not.toBeNull();
		});
	});

	describe("TabsPaginator", () => {
		it("should handle tabs element with proper structure", async () => {
			const tabs = document.createElement("div");

			const tabsContainer = document.createElement("div");
			tabsContainer.classList.add("tabs");
			tabs.appendChild(tabsContainer);

			const tab = document.createElement("div");
			tab.classList.add("tab");
			tabsContainer.appendChild(tab);

			const content = document.createElement("div");
			content.classList.add("content");
			content.textContent = "Tab content";
			tab.appendChild(content);

			const tabsPaginator = new TabsPaginator(tabs, mockPaginator);

			await tabsPaginator.paginateNode();

			expect(mockPaginator.currentContainer.children).toHaveLength(1);
		});

		it("should create new page container when content overflows", () => {
			const tabs = document.createElement("div");

			const mockParentPaginator = {
				createPage: jest.fn(() => document.createElement("div")),
				currentContainer: {},
			};

			const paginator = new TabsPaginator(tabs, mockParentPaginator as any);
			paginator["currentContainer"] = document.createElement("div");
			paginator["tabsContainer"] = document.createElement("div");
			paginator["addTabDimension"] = jest.fn();

			const newContainer = paginator.createPage();

			expect(mockParentPaginator.createPage).toHaveBeenCalled();
			expect(newContainer).not.toBeNull();
		});
	});

	describe("Base Paginator Classes", () => {
		it("should initialize NodePaginator with node and parent", () => {
			const node = document.createElement("div");
			const parent = {} as Paginator;

			const paginator = new (class extends NodePaginator {
				paginateNode() {}
				createPage() {
					return document.createElement("div");
				}
			})(node, parent);

			expect(paginator["node"]).toBe(node);
			expect(paginator["parentPaginator"]).toBe(parent);
		});

		it("should handle element fitting logic", () => {
			const node = document.createElement("div");
			const element = document.createElement("p");
			element.textContent = "Test";

			const paginator = new (class extends Paginator {
				paginateNode() {}
				createPage() {
					return document.createElement("div");
				}
				cleanHeadingElementsIfNeed() {
					this.headingElements = [];
				}
			})(node);

			paginator.currentContainer = document.createElement("div");

			mockNodeDimensions.canUpdateAccumulatedHeight.mockReturnValue(true);
			mockNodeDimensions.updateAccumulatedHeightNode.mockReturnValue({ height: 20, marginBottom: 0 });

			const fits = paginator.tryFitElement(element);

			expect(fits).toBe(true);
			expect(paginator.currentContainer.children).toHaveLength(1);
			expect(paginator.currentContainer.children[0]).toBe(element);
		});

		it("should return false when element cannot fit", () => {
			const node = document.createElement("div");
			const element = document.createElement("p");
			element.textContent = "Test";

			const paginator = new (class extends Paginator {
				paginateNode() {}
				createPage() {
					return document.createElement("div");
				}
				cleanHeadingElementsIfNeed() {
					this.headingElements = [];
				}
			})(node);

			paginator.currentContainer = document.createElement("div");

			mockNodeDimensions.canUpdateAccumulatedHeight.mockReturnValue(false);

			const fits = paginator.tryFitElement(element);

			expect(fits).toBe(false);
		});
	});

	describe("Handler Integration", () => {
		it("should handle table elements through tableHandler", async () => {
			const tableWrapper = document.createElement("div");
			tableWrapper.dataset.component = "table";
			const table = document.createElement("table");
			const tbody = document.createElement("tbody");
			const row = document.createElement("tr");
			const cell = document.createElement("td");

			cell.textContent = "Test";
			row.appendChild(cell);
			tbody.appendChild(row);
			table.appendChild(tbody);
			tableWrapper.appendChild(table);

			const { default: tableHandler } = await import("@ext/markdown/elements/table/print/tableHandler");

			const result = await tableHandler.handle(tableWrapper, mockPaginator);

			expect(result).toBe(true);
		});

		it("should handle list elements through listHandler", async () => {
			const ul = document.createElement("ul");
			const li = document.createElement("li");
			li.textContent = "List item";
			ul.appendChild(li);

			const { default: listHandler } = await import("@ext/markdown/elements/list/print/listHandler");

			const result = await listHandler.handle(ul, mockPaginator);

			expect(result).toBe(true);
		});

		it("should return false for non-table elements in tableHandler", async () => {
			const div = document.createElement("div");
			const mockPaginator = {} as any;

			const { default: tableHandler } = await import("@ext/markdown/elements/table/print/tableHandler");

			const result = await tableHandler.handle(div, mockPaginator);

			expect(result).toBe(false);
		});
	});
});
