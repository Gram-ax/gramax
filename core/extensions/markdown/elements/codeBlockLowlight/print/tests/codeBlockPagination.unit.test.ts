import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import paginateCodeBlock from "../codeBlockPagination";
import { createPage } from "@ext/print/utils/pagination/pageElements";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { AbortController } from "abort-controller";

describe("codeBlockPagination", () => {
	const createMockNodeDimension = (dimensions: Record<string, any> = {}) =>
		({
			get: jest.fn((node: HTMLElement) => {
				const key = node.className || node.tagName.toLowerCase();
				return (
					dimensions[key] || {
						height: 20,
						marginTop: 0,
						marginBottom: 0,
						paddingTop: 0,
						paddingBottom: 0,
						paddingH: 0,
					}
				);
			}),
			canUpdateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeightNode: jest.fn(() => ({ height: 20, marginBottom: 0 })),
			updateAccumulatedHeightDim: jest.fn(() => ({ height: 20, marginBottom: 0 })),
		} as unknown as NodeDimensions);

	beforeEach(() => {
		const abortController = new AbortController();
		Paginator.controlInfo = {
			signal: abortController.signal as AbortSignal,
			progress: { increase: jest.fn(), ratio: 0, emit: jest.fn() },
			yieldTick: jest.fn().mockResolvedValue(undefined),
		};
		Paginator.paginationInfo = {
			nodeDimension: createMockNodeDimension(),
			accumulatedHeight: { height: 0, marginBottom: 0 },
			printHandlers: { required: [], conditional: [] },
		};
		Paginator.printPageInfo = { usablePageHeight: 100 };
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const createMockPaginator = (currentContainer: HTMLElement) => {
		const paginator = {
			currentContainer,
			getUsableHeight: jest.fn(() => 400),
		};
		return paginator;
	};

	const setPageDefaultProperty = (el) => {
		Object.defineProperty(el, "clientWidth", { value: 100, configurable: true });
		Object.defineProperty(el, "clientHeight", { value: 400, configurable: true });

		jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingLeft: "0px",
			paddingRight: "0px",
			paddingTop: "0px",
			paddingBottom: "0px",
		} as any);
	};

	it("returns current page when no child-wrapper exists", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const pre = document.createElement("pre");
		pre.textContent = "some code";

		const result = await paginateCodeBlock(pre, paginator as any);

		expect(result).toBe(false);
		expect(pre.parentElement).toBeNull();
	});

	it("handles empty child-wrapper", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		pre.appendChild(wrapper);

		const result = await paginateCodeBlock(pre, paginator as any);

		expect(result).toBe(true);
		expect(pre.parentElement).toBeNull();
	});

	it("paginates simple code lines within single page", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		pre.appendChild(wrapper);

		for (let i = 0; i < 5; i++) {
			const line = document.createElement("div");
			line.className = "code-line";
			line.textContent = `line ${i}`;
			wrapper.appendChild(line);
		}

		const result = await paginateCodeBlock(pre, paginator as any);

		expect(result).toBe(true);
		expect(pre.parentElement).toBeNull();
		expect(paginator.currentContainer.children).toHaveLength(1);
	});

	it("splits code lines across multiple pages when needed", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);
		paginator.getUsableHeight.mockReturnValue(50);

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		pre.appendChild(wrapper);

		for (let i = 0; i < 10; i++) {
			const line = document.createElement("div");
			line.className = "code-line";
			line.textContent = `line ${i}`;
			wrapper.appendChild(line);
		}

		const result = await paginateCodeBlock(pre, paginator as any);

		expect(result).toBe(true);
		expect(pre.parentElement).toBeNull();
	});

	it("handles code lines with styled spans", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		pre.appendChild(wrapper);

		const line = document.createElement("div");
		line.className = "code-line";
		const span = document.createElement("span");
		span.textContent = "styled";
		line.appendChild(span);
		line.appendChild(document.createTextNode(" text"));
		wrapper.appendChild(line);

		await paginateCodeBlock(pre, paginator as any);

		expect(pre.parentElement).toBeNull();
		expect(paginator.currentContainer.children).toHaveLength(1);
	});

	it("preserves line breaks between code lines", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		pre.appendChild(wrapper);

		for (let i = 0; i < 3; i++) {
			const line = document.createElement("div");
			line.className = "code-line";
			line.textContent = `line ${i}`;
			wrapper.appendChild(line);
			wrapper.appendChild(document.createTextNode("\n"));
		}

		await paginateCodeBlock(pre, paginator as any);

		expect(pre.parentElement).toBeNull();
		expect(paginator.currentContainer.children).toHaveLength(1);
	});

	it("handles pre element with plain text content", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const pre = document.createElement("pre");
		pre.textContent = "plain text content";

		const result = await paginateCodeBlock(pre, paginator as any);

		expect(result).toBe(false);
	});

	it("updates accumulated height correctly", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		pre.appendChild(wrapper);

		const line = document.createElement("div");
		line.className = "code-line";
		line.textContent = "test line";
		wrapper.appendChild(line);

		await paginateCodeBlock(pre, paginator as any);

		expect(pre.parentElement).toBeNull();
	});

	it("handles abort signal", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		const paginator = createMockPaginator(currentPage);

		const abortController = new AbortController();
		abortController.abort();

		Paginator.controlInfo.signal = abortController.signal as AbortSignal;

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		const line = document.createElement("div");
		line.className = "code-line";
		line.textContent = "test";
		wrapper.appendChild(line);
		pre.appendChild(wrapper);

		await expect(paginateCodeBlock(pre, paginator as any)).rejects.toThrow();
	});
});
