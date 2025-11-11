import { createChunkScheduler, nextFrame } from "../scheduling";

describe("scheduling utilities", () => {
	let originalRaf: typeof window.requestAnimationFrame;

	beforeEach(() => {
		originalRaf = window.requestAnimationFrame;
	});

	afterEach(() => {
		window.requestAnimationFrame = originalRaf;
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it("yields only when budget exceeded or forced", async () => {
		const rafMock = jest.fn((cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		});
		window.requestAnimationFrame = rafMock;

		const perfSpy = jest.spyOn(performance, "now");
		perfSpy
			.mockReturnValueOnce(0) // scheduler creation
			.mockReturnValueOnce(5) // first call - within budget
			.mockReturnValueOnce(30) // second call - exceeds budget
			.mockReturnValueOnce(31); // forced call

		const scheduler = createChunkScheduler(20);

		await scheduler();
		expect(rafMock).not.toHaveBeenCalled();

		await scheduler();
		expect(rafMock).toHaveBeenCalledTimes(1);

		await scheduler(true);
		expect(rafMock).toHaveBeenCalledTimes(2);
	});

	it("falls back to setTimeout when requestAnimationFrame is unavailable", async () => {
		const originalSetTimeout = setTimeout;
		(window as any).requestAnimationFrame = undefined;

		const timeoutSpy = jest.fn((cb: () => void) => {
			cb();
			return 0 as unknown as ReturnType<typeof setTimeout>;
		});

		try {
			(globalThis as any).setTimeout = timeoutSpy;
			await expect(nextFrame()).resolves.toBeUndefined();
			expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);
		} finally {
			(globalThis as any).setTimeout = originalSetTimeout;
		}
	});
});
