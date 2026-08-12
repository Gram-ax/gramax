import { withRetries } from "./withRetries";

describe("withRetries", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const run = async <T>(
		func: Parameters<typeof withRetries<T>>[0],
		maxRetryCount?: number,
		retryDelayMs?: number,
	) => {
		const promise = withRetries<T>(func, maxRetryCount, retryDelayMs);
		await jest.runAllTimersAsync();
		return promise;
	};

	it("returns value of first successful attempt without retrying", async () => {
		const func = jest.fn().mockResolvedValue({ type: "success", value: 42 });

		expect(await run<number>(func)).toEqual(42);
		expect(func).toHaveBeenCalledTimes(1);
	});

	it("retries until success and returns its value", async () => {
		const func = jest
			.fn()
			.mockResolvedValueOnce({ type: "continue" })
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce({ type: "success", value: "ok" });

		expect(await run<string>(func)).toEqual("ok");
		expect(func).toHaveBeenCalledTimes(3);
	});

	it("returns undefined after exhausting attempts", async () => {
		const func = jest.fn().mockResolvedValue({ type: "continue" });

		expect(await run<number>(func)).toBeUndefined();
		expect(func).toHaveBeenCalledTimes(3);
	});

	it("stops immediately on break", async () => {
		const func = jest.fn().mockResolvedValueOnce({ type: "continue" }).mockResolvedValueOnce({ type: "break" });

		expect(await run<number>(func)).toBeUndefined();
		expect(func).toHaveBeenCalledTimes(2);
	});

	it("respects maxRetryCount", async () => {
		const func = jest.fn().mockResolvedValue({ type: "continue" });

		expect(await run<number>(func, 5)).toBeUndefined();
		expect(func).toHaveBeenCalledTimes(5);
	});

	it("makes a single attempt when maxRetryCount is 1", async () => {
		const func = jest.fn().mockResolvedValue({ type: "continue" });

		expect(await run<number>(func, 1)).toBeUndefined();
		expect(func).toHaveBeenCalledTimes(1);
	});

	it("does not call func when maxRetryCount is 0", async () => {
		const func = jest.fn().mockResolvedValue({ type: "success", value: 1 });

		expect(await run<number>(func, 0)).toBeUndefined();
		expect(func).not.toHaveBeenCalled();
	});

	it("waits retryDelayMs between attempts and not after the last one", async () => {
		const func = jest.fn().mockResolvedValue({ type: "continue" });
		const promise = withRetries(func, 3, 5000);

		await jest.advanceTimersByTimeAsync(0);
		expect(func).toHaveBeenCalledTimes(1);

		await jest.advanceTimersByTimeAsync(4999);
		expect(func).toHaveBeenCalledTimes(1);

		await jest.advanceTimersByTimeAsync(1);
		expect(func).toHaveBeenCalledTimes(2);

		await jest.advanceTimersByTimeAsync(5000);
		expect(func).toHaveBeenCalledTimes(3);

		expect(await promise).toBeUndefined();
		expect(jest.getTimerCount()).toEqual(0);
	});

	it("propagates rejection from func", async () => {
		const func = jest.fn().mockRejectedValue(new Error("boom"));

		await expect(withRetries(func)).rejects.toThrow("boom");
		expect(func).toHaveBeenCalledTimes(1);
	});

	it("returns a falsy success value as is", async () => {
		const func = jest.fn().mockResolvedValue({ type: "success", value: 0 });

		expect(await run<number>(func)).toEqual(0);
		expect(func).toHaveBeenCalledTimes(1);
	});
});
