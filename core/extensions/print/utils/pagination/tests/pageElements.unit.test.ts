import PagePaginator from "../PagePaginator";
import Paginator from "../Paginator";
import { createPage, PAGE_CLASS, PAGE_CONTENT_CLASS } from "../pageElements";

describe("pageElements", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("creates pages and respects prepend flag", () => {
		const pages = document.createElement("div");
		const first = createPage(pages);
		const second = createPage(pages);
		const prepended = createPage(pages, { prepend: true });

		expect(first.className).toBe(PAGE_CONTENT_CLASS);
		expect(second.className).toBe(PAGE_CONTENT_CLASS);
		expect(prepended.className).toBe(PAGE_CONTENT_CLASS);

		expect(pages.children[0].children[1]).toBe(prepended);
		expect(pages.children[1].children[1]).toBe(first);
		expect(pages.children[2].children[1]).toBe(second);
	});

	it("creates page with custom classNames", () => {
		const pages = document.createElement("div");
		const page = createPage(pages, { classNames: ["custom-class", "another-class"] }).parentElement;

		expect(page.className).toContain(PAGE_CLASS);
		expect(page.className).toContain("custom-class");
		expect(page.className).toContain("another-class");
	});

	it("creates page with afterend option", () => {
		const pages = document.createElement("div");
		const reference = document.createElement("div");
		pages.appendChild(reference);
		const somePage = document.createElement("div");
		pages.appendChild(somePage);

		const page = createPage(pages, { afterend: reference });

		expect(pages.children[0]).toBe(reference);
		expect(pages.children[1].children[1]).toBe(page);
		expect(pages.children[2]).toBe(somePage);
	});

	it("creates page with isTitle option", () => {
		const pages = document.createElement("div");
		const titlePage = createPage(pages, { prepend: true, isTitle: true });

		expect(pages.children[0]).toBe(titlePage);
		expect(titlePage.className).toBe(PAGE_CLASS);
	});

	it("creates proper page structure", () => {
		const pages = document.createElement("div");
		const content = createPage(pages);

		expect(content.className).toBe("page-content");

		const page = content.parentElement;
		expect(page.className).toContain(PAGE_CLASS);

		expect(page.children).toHaveLength(3);

		const top = page.children[0] as HTMLElement;
		expect(top.className).toBe("page-top");
		expect(top.children).toHaveLength(2);
		expect((top.children[0] as HTMLElement).className).toBe("page-top-left");
		expect((top.children[1] as HTMLElement).className).toBe("page-top-right");

		expect((page.children[1] as HTMLElement).className).toBe("page-content");

		const bottom = page.children[2] as HTMLElement;
		expect(bottom.className).toBe("page-bottom");
		expect(bottom.children).toHaveLength(2);
		expect((bottom.children[0] as HTMLElement).className).toBe("page-bottom-left");
		expect((bottom.children[1] as HTMLElement).className).toBe("page-bottom-right");
	});
});

describe("PagePaginator", () => {
	beforeEach(() => {
		Paginator.printPageInfo = {};
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("calculates and sets usable page height with paddings", () => {
		const page = document.createElement("div");
		Object.defineProperty(page, "clientHeight", { value: 300, configurable: true });

		const styleSpy = jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "10px",
			paddingBottom: "20px",
		} as any);

		PagePaginator.setUsablePageHeight(page);

		expect(Paginator.printPageInfo.usablePageHeight).toBe(270.5);
		expect(styleSpy).toHaveBeenCalledWith(page);
	});

	it("calculates and sets usable page width with paddings", () => {
		const page = document.createElement("div");
		Object.defineProperty(page, "clientWidth", { value: 400, configurable: true });

		const styleSpy = jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingLeft: "15px",
			paddingRight: "25px",
		} as any);

		PagePaginator.setUsablePageWidth(page);

		expect(Paginator.printPageInfo.usablePageWidth).toBe(360);
		expect(styleSpy).toHaveBeenCalledWith(page);
	});

	it("handles zero padding values", () => {
		const page = document.createElement("div");
		Object.defineProperty(page, "clientHeight", { value: 100, configurable: true });
		Object.defineProperty(page, "clientWidth", { value: 200, configurable: true });

		jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "0px",
			paddingBottom: "0px",
			paddingLeft: "0px",
			paddingRight: "0px",
		} as any);

		PagePaginator.setUsablePageHeight(page);
		PagePaginator.setUsablePageWidth(page);

		expect(Paginator.printPageInfo.usablePageHeight).toBe(100.5);
		expect(Paginator.printPageInfo.usablePageWidth).toBe(200);
	});

	it("adds height tolerance to usable page height", () => {
		const page = document.createElement("div");
		Object.defineProperty(page, "clientHeight", { value: 200, configurable: true });

		jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "10px",
			paddingBottom: "10px",
		} as any);

		PagePaginator.setUsablePageHeight(page);

		expect(Paginator.printPageInfo.usablePageHeight).toBe(180.5);
	});
});
