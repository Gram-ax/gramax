import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { PaginationState } from "@ext/print/utils/pagination/nodeHandlers";
import paginateCodeBlock from "../codeBlockPagination";
import { createPage } from "@ext/print/utils/pagination/pageElements";
import { createProgressTracker } from "@ext/print/utils/pagination/progress";

describe("codeBlockPagination", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	const createMockNodeDimension = (dimensions: Record<string, any> = {}) =>
		({
			get: jest.fn((node: HTMLElement) => {
				const key = node.className || node.tagName.toLowerCase();
				return (
					dimensions[key] || { height: 20, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }
				);
			}),
			canUpdateAccumulatedHeight: jest.fn(),
			updateAccumulatedHeight: jest.fn(),
		} as unknown as NodeDimensions);

	const createMockState = (currentPage: HTMLElement): PaginationState => ({
		currentPage,
		fragment: document.createDocumentFragment(),
		accumulatedHeight: { height: 0, marginBottom: 0 },
	});

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
		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension();

		const pre = document.createElement("pre");
		pre.textContent = "some code";

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 1, reporter: jest.fn() });

		const result = await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		expect(result).toBe(currentPage);
		expect(pre.parentElement).toBeNull();
	});

	it("handles empty child-wrapper", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension();

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";
		pre.appendChild(wrapper);

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 1, reporter: jest.fn() });

		const result = await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		expect(result).toBe(currentPage);
		expect(pre.parentElement).toBeNull();
	});

	it("paginates simple code lines within single page", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		Object.defineProperty(currentPage, "clientHeight", { value: 200, configurable: true });

		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension({
			pre: { height: 50, marginTop: 0, marginBottom: 10, paddingTop: 5, paddingBottom: 5 },
			"code-line": { height: 15, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 },
		});

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";

		const line1 = document.createElement("div");
		line1.className = "code-line";
		line1.textContent = "const x = 1;";

		const line2 = document.createElement("div");
		line2.className = "code-line";
		line2.textContent = "console.log(x);";

		wrapper.appendChild(line1);
		wrapper.appendChild(line2);
		pre.appendChild(wrapper);

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 2, reporter: jest.fn() });
		const progressSpy = jest.spyOn(progress, "increase");

		const result = await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		expect(result).toBe(currentPage);
		expect(progressSpy).toHaveBeenCalledTimes(2);
		expect(currentPage.querySelectorAll("pre")).toHaveLength(1);
		expect(currentPage.querySelectorAll(".code-line")).toHaveLength(2);
		expect(pre.parentElement).toBeNull();
	});

	it("splits code lines across multiple pages when needed", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		setPageDefaultProperty(currentPage);
		Object.defineProperty(currentPage, "clientHeight", { value: 50, configurable: true });

		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension({
			pre: { height: 0, marginTop: 0, marginBottom: 5, paddingTop: 2, paddingBottom: 2 },
			"code-line": { height: 25, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 },
		});

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";

		for (let i = 0; i < 2; i++) {
			const line = document.createElement("div");
			line.className = "code-line";
			line.textContent = "line " + i;
			wrapper.appendChild(line);
		}

		pre.appendChild(wrapper);

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 2, reporter: jest.fn() });
		const progressSpy = jest.spyOn(progress, "increase");

		const result = await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		expect(pages.children).toHaveLength(2);
		expect(result).toBe(pages.children[1].children[1]);
		expect(progressSpy).toHaveBeenCalledTimes(2);
		expect(yieldTick).toHaveBeenCalledTimes(1);

		const firstPageLines = pages.children[0].querySelectorAll(".code-line");
		const secondPageLines = pages.children[1].querySelectorAll(".code-line");
		expect(firstPageLines.length + secondPageLines.length).toBe(2);
		expect(pre.parentElement).toBeNull();
	});

	it("handles code lines with styled spans", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension();

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";

		const line = document.createElement("div");
		line.className = "code-line";

		const keywordSpan = document.createElement("span");
		keywordSpan.className = "keyword";
		keywordSpan.textContent = "const";

		const variableSpan = document.createElement("span");
		variableSpan.className = "variable";
		variableSpan.textContent = " x ";

		const operatorSpan = document.createElement("span");
		operatorSpan.className = "operator";
		operatorSpan.textContent = "= ";

		const numberSpan = document.createElement("span");
		numberSpan.className = "number";
		numberSpan.textContent = "42";

		line.appendChild(keywordSpan);
		line.appendChild(variableSpan);
		line.appendChild(operatorSpan);
		line.appendChild(numberSpan);

		wrapper.appendChild(line);
		pre.appendChild(wrapper);

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 1, reporter: jest.fn() });

		await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		const clonedLine = currentPage.querySelector(".code-line");
		expect(clonedLine).toBeTruthy();
		expect(clonedLine?.querySelectorAll("span")).toHaveLength(4);
		expect(clonedLine?.querySelector(".keyword")?.textContent).toBe("const");
		expect(clonedLine?.querySelector(".variable")?.textContent).toBe(" x ");
		expect(clonedLine?.querySelector(".operator")?.textContent).toBe("= ");
		expect(clonedLine?.querySelector(".number")?.textContent).toBe("42");
	});

	it("preserves line breaks between code lines", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension();

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";

		const line1 = document.createElement("div");
		line1.className = "code-line";
		line1.textContent = "first line";

		const line2 = document.createElement("div");
		line2.className = "code-line";
		line2.textContent = "second line";

		wrapper.appendChild(line1);
		wrapper.appendChild(line2);
		pre.appendChild(wrapper);

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 2, reporter: jest.fn() });

		await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		const clonedWrapper = currentPage.querySelector(".child-wrapper");
		expect(clonedWrapper).toBeTruthy();

		const childNodes = Array.from(clonedWrapper.childNodes);
		expect(childNodes).toHaveLength(3);
		expect(childNodes[0]).toBeInstanceOf(HTMLElement);
		expect(childNodes[1]).toBeInstanceOf(Text);
		expect((childNodes[1] as Text).data).toBe("\n");
		expect(childNodes[2]).toBeInstanceOf(HTMLElement);
	});

	it("handles pre element with plain text content", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension();

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";

		const codeLine = document.createElement("div");
		codeLine.className = "code-line";
		codeLine.textContent = "plain text code block";
		wrapper.appendChild(codeLine);

		pre.appendChild(wrapper);

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 1, reporter: jest.fn() });

		const result = await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		expect(result).toBe(currentPage);
		expect(currentPage.querySelector(".code-line")?.textContent).toBe("plain text code block");
	});

	it("updates accumulated height correctly", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		Object.defineProperty(currentPage, "clientHeight", { value: 200, configurable: true });

		const state = createMockState(currentPage);
		state.accumulatedHeight = { height: 10, marginBottom: 5 };

		const nodeDimension = createMockNodeDimension({
			pre: { height: 50, marginTop: 0, marginBottom: 10, paddingTop: 5, paddingBottom: 5 },
			"code-line": { height: 15, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 },
		});

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";

		const line = document.createElement("div");
		line.className = "code-line";
		line.textContent = "single line";
		wrapper.appendChild(line);
		pre.appendChild(wrapper);

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 1, reporter: jest.fn() });

		await paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress);

		expect(state.accumulatedHeight.height).toBeGreaterThan(10);
		expect(state.accumulatedHeight.marginBottom).toBe(10);
	});

	it("handles abort signal", async () => {
		const pages = document.createElement("div");
		const currentPage = createPage(pages);
		const state = createMockState(currentPage);
		const nodeDimension = createMockNodeDimension();

		const pre = document.createElement("pre");
		const wrapper = document.createElement("div");
		wrapper.className = "child-wrapper";

		const line = document.createElement("div");
		line.className = "code-line";
		line.textContent = "code";
		wrapper.appendChild(line);
		pre.appendChild(wrapper);

		const abortController = new AbortController();
		abortController.abort();

		const yieldTick = jest.fn().mockResolvedValue(undefined);
		const progress = createProgressTracker({ totalUnits: 1, reporter: jest.fn() });

		await expect(
			paginateCodeBlock(pages, pre, state, nodeDimension, yieldTick, progress, abortController.signal),
		).rejects.toThrow();
	});
});
