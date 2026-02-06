import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import PagePaginator from "@ext/print/utils/pagination/PagePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { AbortController } from "abort-controller";
import printHandlers from "../nodeHandlers";

jest.mock("@ext/print/utils/pagination/abort", () => ({
	throwIfAborted: jest.fn(),
}));

describe("nodeHandlers", () => {
	let mockNodeDimensions: jest.Mocked<NodeDimensions>;
	let mockControlInfo: any;
	let mockPaginationInfo: any;
	let mockPrintPageInfo: any;
	let abortController: AbortController;
	let mockPaginator: jest.Mocked<PagePaginator>;

	beforeEach(() => {
		abortController = new AbortController();

		mockNodeDimensions = {
			get: jest.fn(() => ({
				height: 20,
				marginTop: 0,
				marginBottom: 0,
				paddingH: 5,
			})),
			canUpdateAccumulatedHeight: jest.fn(() => true),
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
			printHandlers: printHandlers,
		};

		mockPrintPageInfo = {
			pages: document.createElement("div"),
		};

		// Устанавливаем статические свойства
		Paginator.controlInfo = mockControlInfo;
		Paginator.paginationInfo = mockPaginationInfo;
		Paginator.printPageInfo = mockPrintPageInfo;

		// Мокаем PagePaginator
		mockPaginator = Object.create(PagePaginator.prototype);
		Object.assign(mockPaginator, {
			currentContainer: document.createElement("div"),
			createPage: jest.fn(),
			getUsableHeight: jest.fn(() => 100),
			headingElements: [],
		});

		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("printHandlers structure", () => {
		it("should export required and conditional handler groups", () => {
			expect(printHandlers).toHaveProperty("required");
			expect(printHandlers).toHaveProperty("conditional");
			expect(Array.isArray(printHandlers.required)).toBe(true);
			expect(Array.isArray(printHandlers.conditional)).toBe(true);
		});

		it("should have required handlers", () => {
			expect(printHandlers.required.length).toBeGreaterThan(0);
		});

		it("should have conditional handlers", () => {
			expect(printHandlers.conditional.length).toBeGreaterThan(0);
		});
	});

	describe("headingHandler", () => {
		it("should handle H1 elements and create new page when `breakBefore` is `page`", async () => {
			const h1 = document.createElement("h1");
			Paginator.paginationInfo.nodeDimension["get"] = jest.fn(() => ({
				height: 20,
				marginTop: 0,
				marginBottom: 0,
				paddingH: 5,
				breakBefore: "page",
			}));

			h1.textContent = "Test Heading";
			mockPaginator.currentContainer.appendChild(document.createElement("p"));

			const { default: headingHandler } = await import("@ext/markdown/elements/heading/print/headingHandler");
			const result = await headingHandler.handle(h1, mockPaginator);

			expect(result).toBe(true);
			expect(mockPaginator.createPage).toHaveBeenCalled();
			expect(mockPaginator.currentContainer.contains(h1)).toBe(true);
		});

		it("should handle H1 elements without creating new page when `breakBefore` is not `page`", async () => {
			const h1 = document.createElement("h1");
			h1.textContent = "Test Heading";
			mockPaginator.currentContainer.innerHTML = "";

			const { default: headingHandler } = await import("@ext/markdown/elements/heading/print/headingHandler");
			const result = await headingHandler.handle(h1, mockPaginator);

			expect(result).toBe(true);
			expect(mockPaginator.createPage).not.toHaveBeenCalled();
			expect(mockPaginator.currentContainer.contains(h1)).toBe(true);
		});

		it("should return false for non-H1 elements", async () => {
			const div = document.createElement("div");

			const { default: headingHandler } = await import("@ext/markdown/elements/heading/print/headingHandler");

			const result = await headingHandler.handle(div, mockPaginator);

			expect(result).toBe(false);
		});
	});

	describe("tableHandler", () => {
		it("should handle TABLE elements and delegate to TablePaginator", async () => {
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

			const mockTablePaginator = {
				paginateNode: jest.fn().mockResolvedValue(undefined),
				currentContainer: document.createElement("div"),
			};

			const TablePaginatorMock = jest.fn().mockReturnValue(mockTablePaginator);
			jest.doMock("@ext/markdown/elements/table/print/TablePaginator", () => ({
				TablePaginator: TablePaginatorMock,
			}));

			const { default: tableHandler } = await import("@ext/markdown/elements/table/print/tableHandler");

			const result = await tableHandler.handle(tableWrapper, mockPaginator);

			expect(result).toBe(true);
		});

		it("should return false for non-TABLE elements", async () => {
			const div = document.createElement("div");

			const { default: tableHandler } = await import("@ext/markdown/elements/table/print/tableHandler");

			const result = await tableHandler.handle(div, mockPaginator);

			expect(result).toBe(false);
		});
	});

	describe("codeBlockHandler", () => {
		it("should handle PRE elements with child-wrapper", async () => {
			const pre = document.createElement("pre");
			pre.textContent = "console.log('test');";

			const childWrapper = document.createElement("div");
			childWrapper.classList.add("child-wrapper");
			const codeLine = document.createElement("div");
			codeLine.classList.add("code-line");
			codeLine.textContent = "console.log('test');";
			childWrapper.appendChild(codeLine);
			pre.appendChild(childWrapper);

			const { default: codeBlockHandler } = await import(
				"@ext/markdown/elements/codeBlockLowlight/print/codeBlockHandler"
			);

			const result = await codeBlockHandler.handle(pre, mockPaginator);

			expect(result).toBe(true);
		});

		it("should return false for PRE elements without child-wrapper", async () => {
			const pre = document.createElement("pre");
			pre.textContent = "console.log('test');";

			const { default: codeBlockHandler } = await import(
				"@ext/markdown/elements/codeBlockLowlight/print/codeBlockHandler"
			);

			const result = await codeBlockHandler.handle(pre, mockPaginator);

			expect(result).toBe(false);
		});
	});

	describe("listHandler", () => {
		it("should handle UL and OL elements and delegate to ListPaginator", async () => {
			const ul = document.createElement("ul");
			const li = document.createElement("li");
			li.textContent = "List item";
			ul.appendChild(li);

			const mockListPaginator = {
				paginateNode: jest.fn().mockResolvedValue(undefined),
				currentContainer: document.createElement("div"),
			};

			const ListPaginatorMock = jest.fn().mockReturnValue(mockListPaginator);
			jest.doMock("@ext/markdown/elements/list/print/ListPaginator", () => ({
				ListPaginator: ListPaginatorMock,
			}));

			const { default: listHandler } = await import("@ext/markdown/elements/list/print/listHandler");

			const result = await listHandler.handle(ul, mockPaginator);

			expect(result).toBe(true);
		});

		it("should handle OL elements", async () => {
			const ol = document.createElement("ol");
			const li = document.createElement("li");
			li.textContent = "Ordered item";
			ol.appendChild(li);

			const mockListPaginator = {
				paginateNode: jest.fn().mockResolvedValue(undefined),
				currentContainer: document.createElement("div"),
			};

			const ListPaginatorMock = jest.fn().mockReturnValue(mockListPaginator);
			jest.doMock("@ext/markdown/elements/list/print/ListPaginator", () => ({
				ListPaginator: ListPaginatorMock,
			}));

			const { default: listHandler } = await import("@ext/markdown/elements/list/print/listHandler");

			const result = await listHandler.handle(ol, mockPaginator);

			expect(result).toBe(true);
		});

		it("should return false for non-list elements", async () => {
			const div = document.createElement("div");

			const { default: listHandler } = await import("@ext/markdown/elements/list/print/listHandler");

			const result = await listHandler.handle(div, mockPaginator);

			expect(result).toBe(false);
		});
	});

	describe("snippetHandler", () => {
		it("should handle DIV elements with snippet component", async () => {
			const snippet = document.createElement("div");
			snippet.dataset.component = "snippet";
			snippet.textContent = "Snippet content";

			const { default: snippetHandler } = await import("@ext/markdown/elements/snippet/print/snippetHandler");

			const result = await snippetHandler.handle(snippet, mockPaginator);

			expect(result).toBe(true);
		});

		it("should return false for DIV elements without snippet component", async () => {
			const div = document.createElement("div");
			div.textContent = "Regular div";

			const { default: snippetHandler } = await import("@ext/markdown/elements/snippet/print/snippetHandler");

			const result = await snippetHandler.handle(div, mockPaginator);

			expect(result).toBe(false);
		});
	});

	describe("noteHandler", () => {
		it("should handle DIV elements with admonition class and proper structure", async () => {
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

			const { default: noteHandler } = await import("@ext/markdown/elements/note/print/noteHandler");

			const result = await noteHandler.handle(note, mockPaginator);

			expect(result).toBe(true);
		});

		it("should return false for DIV elements without admonition class", async () => {
			const div = document.createElement("div");
			div.textContent = "Regular div";

			const { default: noteHandler } = await import("@ext/markdown/elements/note/print/noteHandler");

			const result = await noteHandler.handle(div, mockPaginator);

			expect(result).toBe(false);
		});
	});

	describe("tabsHandler", () => {
		it("should handle DIV elements with tabs component", async () => {
			const tabsWrapper = document.createElement("div");
			tabsWrapper.dataset.component = "tabs";
			const tabsContainer = document.createElement("div");
			tabsWrapper.appendChild(tabsContainer);
			tabsContainer.textContent = "Tabs content";

			const { default: tabsHandler } = await import("@ext/markdown/elements/tabs/print/tabsHandler");

			const result = await tabsHandler.handle(tabsWrapper, mockPaginator);

			expect(result).toBe(true);
		});

		it("should return false for DIV elements without tabs component", async () => {
			const div = document.createElement("div");
			div.textContent = "Regular div";

			const { default: tabsHandler } = await import("@ext/markdown/elements/tabs/print/tabsHandler");

			const result = await tabsHandler.handle(div, mockPaginator);

			expect(result).toBe(false);
		});
	});

	describe("handler integration through printHandlers", () => {
		it("should call required handlers first", async () => {
			const h1 = document.createElement("h1");
			h1.textContent = "Heading";

			mockPaginator.currentContainer.innerHTML = "";

			// Вызываем через printHandlers.required
			const requiredHandlers = printHandlers.required;
			let handled = false;

			for (const handler of requiredHandlers) {
				if (await handler(h1, mockPaginator)) {
					handled = true;
					break;
				}
			}

			expect(handled).toBe(true);
		});

		it("should call conditional handlers if required handlers don't handle", async () => {
			const unknownElement = document.createElement("unknown");

			// Вызываем через printHandlers.required и conditional
			let handled = false;

			// Сначала required
			for (const handler of printHandlers.required) {
				if (await handler(unknownElement, mockPaginator)) {
					handled = true;
					break;
				}
			}

			// Потом conditional, если required не обработали
			if (!handled) {
				for (const handler of printHandlers.conditional) {
					if (await handler(unknownElement, mockPaginator)) {
						handled = true;
						break;
					}
				}
			}

			expect(handled).toBe(false); // unknown элемент не должен быть обработан
		});
	});
});
