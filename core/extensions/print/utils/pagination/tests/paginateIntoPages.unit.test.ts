import type { ArticlePreview, PdfPrintParams } from "@ext/print/types";

jest.mock("../../tocPage/initTocPageContent", () => ({
	initTocPageContent: jest.fn(),
}));
jest.mock("../printTemplateImages", () => ({
	waitForPrintTemplateImages: jest.fn().mockResolvedValue(undefined),
}));

import paginateIntoPages from "@ext/print/utils/paginateIntoPages";
import { PaginationAbortError } from "@ext/print/utils/pagination/abort";
import { waitForPrintTemplateImages } from "@ext/print/utils/pagination/printTemplateImages";
import { TITLE_PAGE_CLASS } from "@ext/print/utils/pagination/titlePage";
import { initTocPageContent } from "../../tocPage/initTocPageContent";

describe("paginateIntoPages integration", () => {
	beforeEach(() => {
		jest.mocked(waitForPrintTemplateImages).mockResolvedValue(undefined);
		(document as unknown as { fonts: { ready: Promise<void> } }).fonts = {
			ready: Promise.resolve(),
		};

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
		} as CSSStyleDeclaration);
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders content, toc and title pages with progress reporting", async () => {
		const source = document.createElement("div");
		const heading = document.createElement("h1");
		heading.textContent = "Heading";
		const span = document.createElement("span");
		span.textContent = "Content";
		source.appendChild(heading);
		source.appendChild(span);

		Object.defineProperty(heading, "offsetHeight", {
			value: 40,
			configurable: true,
		});
		Object.defineProperty(span, "offsetHeight", {
			value: 60,
			configurable: true,
		});

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

		expect(initTocPageContent).toHaveBeenCalledWith(pages, items, params.titlePage, params.tocPageTitle);
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

	it("waits for template images before completing pagination", async () => {
		const source = document.createElement("div");
		const content = document.createElement("span");
		source.appendChild(content);
		Object.defineProperty(content, "offsetHeight", {
			value: 40,
			configurable: true,
		});
		const pages = document.createElement("div");
		const params: PdfPrintParams = {
			titlePage: true,
			tocPage: false,
			titleNumber: false,
		};
		const template = ".title-page { background-image: url('/title-page.png'); }";
		let markImageWaitStarted: VoidFunction;
		const imageWaitStarted = new Promise<void>((resolve) => {
			markImageWaitStarted = resolve;
		});
		let finishImageWait: VoidFunction;
		const imageWait = new Promise<void>((resolve) => {
			finishImageWait = resolve;
		});
		jest.mocked(waitForPrintTemplateImages).mockImplementationOnce(() => {
			markImageWaitStarted();
			return imageWait;
		});
		const onDone = jest.fn();

		const pagination = paginateIntoPages(source, pages, params, { items: [], title: "Title", template }, onDone);
		await imageWaitStarted;

		expect(waitForPrintTemplateImages).toHaveBeenCalledWith(template, undefined);
		expect(onDone).not.toHaveBeenCalled();

		finishImageWait();
		await pagination;
		expect(onDone).toHaveBeenCalledTimes(1);
	});
});
