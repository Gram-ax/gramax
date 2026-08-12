import { PaginationAbortError } from "../abort";
import { waitForPrintTemplateImages } from "../printTemplateImages";

class TestImage {
	static instances: TestImage[] = [];

	onload: VoidFunction | null = null;
	onerror: VoidFunction | null = null;
	decode = jest.fn<Promise<void>, []>().mockResolvedValue();
	src = "";

	constructor() {
		TestImage.instances.push(this);
	}
}

const createDeferred = () => {
	let resolve: VoidFunction;
	const promise = new Promise<void>((promiseResolve) => {
		resolve = promiseResolve;
	});
	return { promise, resolve: resolve! };
};

describe("waitForPrintTemplateImages", () => {
	const OriginalImage = globalThis.Image;

	beforeAll(() => {
		Object.defineProperty(globalThis, "Image", {
			configurable: true,
			value: TestImage,
			writable: true,
		});
	});

	beforeEach(() => {
		TestImage.instances = [];
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	afterAll(() => {
		Object.defineProperty(globalThis, "Image", {
			configurable: true,
			value: OriginalImage,
			writable: true,
		});
	});

	it("loads each supported CSS image URL once", async () => {
		const dataUrl = "data:image/png;base64,AA==";
		const httpUrl = "https://example.com/title-page.png?version=1";
		const pending = waitForPrintTemplateImages(`
			.first { background-image: url("${dataUrl}"); }
			.second { background-image: url('${httpUrl}'); }
			.duplicate { background-image: url(${httpUrl}); }
			.font { src: url("https://example.com/font.woff2"); }
		`);

		expect(TestImage.instances.map((image) => image.src)).toEqual([dataUrl, httpUrl]);
		TestImage.instances.forEach((image) => image.onerror?.());
		await pending;
	});

	it("waits for image decoding after load", async () => {
		const decoded = createDeferred();
		let completed = false;
		const pending = waitForPrintTemplateImages(".title-page { background: url('/title-page.png'); }").then(() => {
			completed = true;
		});
		const image = TestImage.instances[0];
		image.decode.mockReturnValue(decoded.promise);

		image.onload?.();
		await Promise.resolve();

		expect(image.decode).toHaveBeenCalledTimes(1);
		expect(completed).toBe(false);

		decoded.resolve();
		await pending;
		expect(completed).toBe(true);
	});

	it("continues when an image cannot be loaded", async () => {
		const pending = waitForPrintTemplateImages(".title-page { background: url('/missing.png'); }");

		TestImage.instances[0].onerror?.();

		await expect(pending).resolves.toBeUndefined();
	});

	it("continues after the image load timeout", async () => {
		jest.useFakeTimers();
		const pending = waitForPrintTemplateImages(".title-page { background: url('/slow.png'); }");

		jest.advanceTimersByTime(30_000);

		await expect(pending).resolves.toBeUndefined();
	});

	it("rejects when loading is aborted", async () => {
		const controller = new AbortController();
		const pending = waitForPrintTemplateImages(
			".title-page { background: url('/title-page.png'); }",
			controller.signal,
		);

		controller.abort("cancelled");

		await expect(pending).rejects.toBeInstanceOf(PaginationAbortError);
	});
});
