import { handleSpecialNode, PaginationState } from "../nodeHandlers";
import { createProgressTracker } from "../progress";
import { createPage } from "../pageElements";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { paginateTable } from "@ext/markdown/elements/table/print/tablePagination";
import paginateCodeBlock from "@ext/markdown/elements/codeBlockLowlight/print/codeBlockPagination";

jest.mock("@ext/markdown/elements/table/print/tablePagination", () => ({
	__esModule: true,
	paginateTable: jest.fn(),
}));

jest.mock("@ext/markdown/elements/codeBlockLowlight/print/codeBlockPagination", () => ({
	__esModule: true,
	default: jest.fn(),
}));

const paginateTableMock = paginateTable as jest.MockedFunction<typeof paginateTable>;
const paginateCodeBlockMock = paginateCodeBlock as jest.MockedFunction<typeof paginateCodeBlock>;

describe("nodeHandlers", () => {
	beforeEach(() => {
		paginateTableMock.mockReset();
		paginateCodeBlockMock.mockReset();
	});

	const createContext = (overrides: Partial<Parameters<typeof handleSpecialNode>[2]> = {}) => {
		const reporter = jest.fn();
		const progress = createProgressTracker({
			totalUnits: 10,
			reporter,
		});

		const mockNodeDimension = {
			get: jest.fn(),
			canUpdateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeight: jest.fn().mockReturnValue({ height: 0, marginBottom: 0 }),
		};

		return {
			pages: document.createElement("div"),
			nodeDimension: mockNodeDimension as unknown as NodeDimensions,
			nodeHeights: new WeakMap<HTMLElement, number>(),
			yieldTick: jest.fn().mockResolvedValue(undefined),
			progress,
			signal: undefined as AbortSignal | undefined,
			...overrides,
		};
	};

	it("returns false when node is not handled", async () => {
		const context = createContext();
		const page = createPage(context.pages);
		const state: PaginationState = {
			currentPage: page,
			fragment: document.createDocumentFragment(),
			accumulatedHeight: { height: 0, marginBottom: 0 },
		};

		const handled = await handleSpecialNode(document.createElement("section"), state, context);

		expect(handled).toBe(false);
		expect(state.currentPage).toBe(page);
	});

	it("handles h1 nodes and prepares a fresh page", async () => {
		const context = createContext();
		const progressSpy = jest.spyOn(context.progress, "increase");
		const currentPage = createPage(context.pages);
		currentPage.appendChild(document.createElement("p"));

		const fragment = document.createDocumentFragment();
		fragment.appendChild(document.createElement("span"));

		const state: PaginationState = {
			currentPage,
			fragment,
			accumulatedHeight: { height: 42, marginBottom: 0 },
		};

		const heading = document.createElement("h1");
		heading.textContent = "Heading";

		const handled = await handleSpecialNode(heading, state, context);

		expect(handled).toBe(true);
		expect(context.pages.children).toHaveLength(2);
		expect(state.currentPage).not.toBe(currentPage);
		expect(state.fragment.childNodes).toHaveLength(0);
		expect(state.accumulatedHeight).toEqual({ height: 0, marginBottom: 0 });
		expect(progressSpy).toHaveBeenCalledWith(1);
		expect(state.currentPage.contains(heading)).toBe(true);
		expect(currentPage.childElementCount).toBeGreaterThan(1);
	});

	it("handles h1 nodes on empty page without creating new page", async () => {
		const context = createContext();
		const progressSpy = jest.spyOn(context.progress, "increase");
		const currentPage = createPage(context.pages);

		const state: PaginationState = {
			currentPage,
			fragment: document.createDocumentFragment(),
			accumulatedHeight: { height: 0, marginBottom: 0 },
		};

		const heading = document.createElement("h1");
		heading.textContent = "Heading";

		const handled = await handleSpecialNode(heading, state, context);

		expect(handled).toBe(true);
		expect(context.pages.children).toHaveLength(1);
		expect(state.currentPage).toBe(currentPage);
		expect(state.fragment.childNodes).toHaveLength(0);
		expect(state.accumulatedHeight).toEqual({ height: 0, marginBottom: 0 });
		expect(progressSpy).toHaveBeenCalledWith(1);
		expect(state.currentPage.contains(heading)).toBe(true);
	});

	it("handles table nodes, flushing fragments and delegating to paginateTable", async () => {
		const context = createContext();
		const progressSpy = jest.spyOn(context.progress, "increase");
		const currentPage = createPage(context.pages);

		const fragment = document.createDocumentFragment();
		fragment.appendChild(document.createElement("span"));

		const newPage = createPage(context.pages);
		newPage.parentElement.remove();

		paginateTableMock.mockResolvedValueOnce(newPage);

		const state: PaginationState = {
			currentPage,
			fragment,
			accumulatedHeight: { height: 100, marginBottom: 0 },
		};

		const table = document.createElement("table");
		const handled = await handleSpecialNode(table, state, context);

		expect(handled).toBe(true);
		expect(paginateTableMock).toHaveBeenCalledWith(
			context.pages,
			table,
			state,
			context.nodeDimension,
			context.yieldTick,
			context.progress,
			context.signal,
		);
		expect(progressSpy).toHaveBeenCalledWith(1);
		expect(progressSpy).toHaveBeenCalledTimes(1);
		expect(context.yieldTick).toHaveBeenCalledTimes(2);
		expect(state.currentPage).toBe(newPage);
		expect(state.fragment.childNodes).toHaveLength(0);
		expect(state.accumulatedHeight).toEqual({ height: 100, marginBottom: 0 });
		expect(currentPage.childElementCount).toBeGreaterThan(0);
	});

	it("handles pre nodes (code blocks) and delegates to paginateCodeBlock", async () => {
		const context = createContext();
		const progressSpy = jest.spyOn(context.progress, "increase");
		const currentPage = createPage(context.pages);

		const fragment = document.createDocumentFragment();
		fragment.appendChild(document.createElement("span"));

		const newPage = createPage(context.pages);
		newPage.parentElement.remove();

		paginateCodeBlockMock.mockResolvedValueOnce(newPage);

		const state: PaginationState = {
			currentPage,
			fragment,
			accumulatedHeight: { height: 50, marginBottom: 0 },
		};

		const pre = document.createElement("pre");
		const handled = await handleSpecialNode(pre, state, context);

		expect(handled).toBe(true);
		expect(paginateCodeBlockMock).toHaveBeenCalledWith(
			context.pages,
			pre,
			state,
			context.nodeDimension,
			context.yieldTick,
			context.progress,
			context.signal,
		);
		expect(progressSpy).toHaveBeenCalledWith(1);
		expect(context.yieldTick).toHaveBeenCalledTimes(2);
		expect(state.currentPage).toBe(newPage);
		expect(state.fragment.childNodes).toHaveLength(0);
		expect(state.accumulatedHeight).toEqual({ height: 50, marginBottom: 0 });
		expect(currentPage.childElementCount).toBeGreaterThan(0);
	});

	it("handles pre nodes on empty page without flushing fragments", async () => {
		const context = createContext();
		const progressSpy = jest.spyOn(context.progress, "increase");
		const currentPage = createPage(context.pages);

		const newPage = createPage(context.pages);
		newPage.parentElement.remove();

		paginateCodeBlockMock.mockResolvedValueOnce(newPage);

		const state: PaginationState = {
			currentPage,
			fragment: document.createDocumentFragment(),
			accumulatedHeight: { height: 0, marginBottom: 0 },
		};

		const pre = document.createElement("pre");
		const handled = await handleSpecialNode(pre, state, context);

		expect(handled).toBe(true);
		expect(paginateCodeBlockMock).toHaveBeenCalledWith(
			context.pages,
			pre,
			state,
			context.nodeDimension,
			context.yieldTick,
			context.progress,
			context.signal,
		);
		expect(progressSpy).toHaveBeenCalledWith(1);
		expect(context.yieldTick).toHaveBeenCalledTimes(1);
		expect(state.currentPage).toBe(newPage);
	});

	it("returns false for unsupported tags", async () => {
		const context = createContext();
		const page = createPage(context.pages);
		const state: PaginationState = {
			currentPage: page,
			fragment: document.createDocumentFragment(),
			accumulatedHeight: { height: 0, marginBottom: 0 },
		};

		const div = document.createElement("div");
		const p = document.createElement("p");
		const span = document.createElement("span");

		expect(await handleSpecialNode(div, state, context)).toBe(false);
		expect(await handleSpecialNode(p, state, context)).toBe(false);
		expect(await handleSpecialNode(span, state, context)).toBe(false);
	});
});
