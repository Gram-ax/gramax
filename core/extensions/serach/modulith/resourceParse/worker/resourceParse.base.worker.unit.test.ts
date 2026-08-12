import { XxHash } from "@core/Hash/Hasher";
import { pdfToArticleItems } from "@ics/article-search-pdf-parse";
import { handleMessage } from "./resourceParse.base.worker";

jest.mock("@ics/article-search-pdf-parse", () => ({ pdfToArticleItems: jest.fn().mockResolvedValue([]) }));

describe("resource parse worker", () => {
	beforeAll(async () => await XxHash.init());

	it("initializes hashing in the worker before processing a resource", async () => {
		const init = jest.spyOn(XxHash, "init");
		const postMessage = jest.fn();

		await handleMessage(
			{
				type: "parseResourceFile",
				requestId: "request-1",
				articleId: "article-1" as never,
				title: "missing.docx",
				format: "docx",
				source: { targets: [{ kind: "disk", path: "/catalog/missing.docx" }] },
			},
			{ isNode: true, readFile: jest.fn().mockResolvedValue(undefined), postMessage },
		);

		expect(init).toHaveBeenCalledTimes(1);
	});

	it("skips parsing a resource when its hash is already indexed", async () => {
		const data = Buffer.from("unchanged resource");
		const hash = String(XxHash.single(data));
		const readFile = jest.fn().mockResolvedValue(data);
		const postMessage = jest.fn();

		await handleMessage(
			{
				type: "parseResourceFile",
				requestId: "request-1",
				articleId: "article-1" as never,
				title: "resource.docx",
				format: "docx",
				knownHash: hash,
				source: { targets: [{ kind: "disk", path: "/catalog/resource.docx" }] },
			},
			{ isNode: true, readFile, postMessage },
		);

		expect(readFile).toHaveBeenCalledWith({ kind: "disk", path: "/catalog/resource.docx" });
		expect(postMessage).toHaveBeenCalledWith({ type: "result", requestId: "request-1", hash, items: undefined });
	});

	it("passes a Uint8Array to the PDF parser", async () => {
		const data = Buffer.from("pdf data");

		await handleMessage(
			{
				type: "parseResource",
				requestId: "request-2",
				articleId: "article-1" as never,
				title: "resource.pdf",
				format: "pdf",
				data,
			},
			{ isNode: true, postMessage: jest.fn() },
		);

		expect(pdfToArticleItems).toHaveBeenCalledWith(
			"article-1",
			"resource.pdf",
			expect.any(Uint8Array),
			expect.any(Function),
		);
		expect((pdfToArticleItems as jest.Mock).mock.calls.at(-1)[2]).not.toBeInstanceOf(Buffer);
	});
});
