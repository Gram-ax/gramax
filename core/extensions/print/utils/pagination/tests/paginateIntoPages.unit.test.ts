import { ArticlePreview, PdfPrintParams } from "@ext/print/types";

jest.mock("../../initTocPageContent", () => ({
	initTocPageContent: jest.fn(),
}));

import { initTocPageContent } from "../../initTocPageContent";
import { clearUsableHeightCache } from "@ext/print/utils/pagination/pageElements";
import paginateIntoPages from "@ext/print/utils/paginateIntoPages";
import { TITLE_PAGE_CLASS } from "@ext/print/utils/pagination/titlePage";
import { PaginationAbortError } from "@ext/print/utils/pagination/abort";

describe("paginateIntoPages integration", () => {
	beforeEach(() => {
		clearUsableHeightCache();
		(document as any).fonts = { ready: Promise.resolve() };

		window.requestAnimationFrame = (cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		};

		let now = 0;
		jest.spyOn(performance, "now").mockImplementation(() => {
			now += 5;
			return now;
		});
		jest.spyOn(window, "getComputedStyle").mockReturnValue({
			paddingTop: "0px",
			paddingBottom: "0px",
		} as any);
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders content, toc and title pages with progress reporting", async () => {
		const source = document.createElement("div");
		const heading = document.createElement("h1");
		heading.textContent = "Heading";
		const paragraph = document.createElement("p");
		paragraph.textContent = "Content";
		source.appendChild(heading);
		source.appendChild(paragraph);

		Object.defineProperty(heading, "offsetHeight", { value: 40, configurable: true });
		Object.defineProperty(paragraph, "offsetHeight", { value: 60, configurable: true });

		const pages = document.createElement("div");
		const params: PdfPrintParams = {
			titlePage: true,
			tocPage: true,
			titleNumber: true,
			template: undefined,
		};

		const items: ArticlePreview[] = [
			{
				title: "Example",
				level: 1,
				apiUrlCreator: null as unknown as ArticlePreview["apiUrlCreator"],
				content: null as unknown as ArticlePreview["content"],
				logicPath: "example",
			},
		];

		const onDone = jest.fn();
		const onProgress = jest.fn();

		await paginateIntoPages(source, pages, params, { items, title: "Title" }, onDone, onProgress);

		expect(initTocPageContent).toHaveBeenCalledWith(pages, items, params.titlePage);
		expect(pages.firstElementChild).not.toBeNull();
		expect(pages.firstElementChild?.classList.contains(TITLE_PAGE_CLASS)).toBe(true);
		const lastProgressCall = onProgress.mock.calls.at(-1)?.[0];
		expect(lastProgressCall).toEqual(
			expect.objectContaining({
				stage: "exporting",
				ratio: 0.99,
				cliMessage: expect.stringContaining("done-print-document"),
			}),
		);
		expect(onDone).toHaveBeenCalled();
	});

	it("aborts early when signal already aborted", async () => {
		const source = document.createElement("div");
		const pages = document.createElement("div");
		const params: PdfPrintParams = {
			titlePage: false,
			tocPage: false,
			titleNumber: false,
		};
		const items: ArticlePreview[] = [];

		const controller = new AbortController();
		controller.abort("user cancel");

		await expect(
			paginateIntoPages(source, pages, params, { items, title: "Title" }, undefined, undefined, {
				signal: controller.signal,
			}),
		).rejects.toThrow(PaginationAbortError);
	});
});
