import {
	createPage,
	getUsableHeight,
	getUsableWidth,
	getUsableHeightCached,
	clearUsableHeightCache,
	PAGE_CONTENT_CLASS,
	PAGE_CLASS,
} from "../pageElements";

describe("pageElements", () => {
	afterEach(() => {
		clearUsableHeightCache();
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

	it("calculates usable height with paddings", () => {
		const el = document.createElement("div");
		Object.defineProperty(el, "clientHeight", { value: 300, configurable: true });

		const styleSpy = jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "10px",
			paddingBottom: "20px",
		} as any);

		expect(getUsableHeight(el)).toBe(270);
		expect(styleSpy).toHaveBeenCalledTimes(1);
	});

	it("calculates usable width with paddings", () => {
		const el = document.createElement("div");
		Object.defineProperty(el, "clientWidth", { value: 400, configurable: true });

		const styleSpy = jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingLeft: "15px",
			paddingRight: "25px",
		} as any);

		expect(getUsableWidth(el)).toBe(360);
		expect(styleSpy).toHaveBeenCalledTimes(1);
	});

	it("caches usable height values", () => {
		const el = document.createElement("div");
		Object.defineProperty(el, "clientHeight", { value: 200, configurable: true });

		const styleSpy = jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "5px",
			paddingBottom: "5px",
		} as any);

		expect(getUsableHeightCached(el)).toBe(190);
		styleSpy.mockClear();
		expect(getUsableHeightCached(el)).toBe(190);

		expect(styleSpy).not.toHaveBeenCalled();
	});

	it("clears usable height cache", () => {
		const el = document.createElement("div");
		Object.defineProperty(el, "clientHeight", { value: 150, configurable: true });

		const styleSpy = jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "10px",
			paddingBottom: "10px",
		} as any);

		expect(getUsableHeightCached(el)).toBe(130);
		expect(getUsableHeightCached(el)).toBe(130);

		clearUsableHeightCache();

		expect(getUsableHeightCached(el)).toBe(130);
		expect(styleSpy).toHaveBeenCalledTimes(2);
	});

	it("handles zero padding values", () => {
		const el = document.createElement("div");
		Object.defineProperty(el, "clientHeight", { value: 100, configurable: true });
		Object.defineProperty(el, "clientWidth", { value: 200, configurable: true });

		jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "0px",
			paddingBottom: "0px",
			paddingLeft: "0px",
			paddingRight: "0px",
		} as any);

		expect(getUsableHeight(el)).toBe(100);
		expect(getUsableWidth(el)).toBe(200);
	});
});
