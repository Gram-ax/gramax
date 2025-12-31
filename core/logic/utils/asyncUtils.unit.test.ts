import "./asyncUtils"; // Import for extending Array.prototype
import { asyncUtils } from "./asyncUtils";

describe("asyncUtils", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("mapSequential", () => {
		it("executes callbacks sequentially", async () => {
			const executionOrder: number[] = [];
			const result = await asyncUtils.mapSeq([100, 50, 200], async (delay, index) => {
				await new Promise((resolve) => setTimeout(resolve, delay));
				executionOrder.push(index);
				return delay * 2;
			});

			expect(result).toEqual([200, 100, 400]);
			expect(executionOrder).toEqual([0, 1, 2]);
		});

		it("handles empty array", async () => {
			const result = await asyncUtils.mapSeq([], async (x) => x);
			expect(result).toEqual([]);
		});

		it("stops on error", async () => {
			const callbackSpy = jest
				.fn()
				.mockResolvedValueOnce("success")
				.mockRejectedValueOnce(new Error("test error"));

			await expect(asyncUtils.mapSeq(["a", "b", "c"], callbackSpy)).rejects.toThrow("test error");
			expect(callbackSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe("foreachSequential", () => {
		it("executes callbacks sequentially", async () => {
			const executionOrder: number[] = [];
			await asyncUtils.forEachSeq([100, 50], async (_, index) => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				executionOrder.push(index);
			});

			expect(executionOrder).toEqual([0, 1]);
		});

		it("handles empty array", async () => {
			await asyncUtils.forEachSeq([], async () => {});
		});
	});

	describe("forEachConcurrent", () => {
		it("executes callbacks concurrently with limit", async () => {
			const startTimes: number[] = [];
			const startTime = Date.now();

			await asyncUtils.forEachConcurrent(
				[100, 50, 200, 30],
				async (delay, index) => {
					startTimes[index] = Date.now() - startTime;
					await new Promise((resolve) => setTimeout(resolve, delay));
				},
				2,
			);

			expect(startTimes[0]).toBeLessThan(10);
			expect(startTimes[1]).toBeLessThan(10);
			expect(startTimes[2]).toBeGreaterThan(40);
		});

		it("uses sequential execution when concurrencyLimit = 1", async () => {
			const spy = jest.spyOn(asyncUtils, "forEachSeq");
			await asyncUtils.forEachConcurrent([1, 2], jest.fn().mockResolvedValue(undefined), 1);
			expect(spy).toHaveBeenCalled();
			spy.mockRestore();
		});

		it("handles concurrencyLimit = 0", async () => {
			const callback = jest.fn().mockResolvedValue(undefined);
			await asyncUtils.forEachConcurrent([1, 2, 3], callback, 0);
			expect(callback).toHaveBeenCalledTimes(3);
		});
	});

	describe("mapConcurrent", () => {
		it("executes mapping concurrently with limit", async () => {
			const result = await asyncUtils.mapAsync(
				[200, 100, 50],
				async (delay) => {
					await new Promise((resolve) => setTimeout(resolve, delay));
					return delay;
				},
				2,
			);

			expect(result).toEqual([200, 100, 50]);
		});

		it("uses sequential execution when concurrencyLimit = 1", async () => {
			const spy = jest.spyOn(asyncUtils, "mapSeq");
			await asyncUtils.mapAsync([1, 2], jest.fn().mockResolvedValue("result"), 1);
			expect(spy).toHaveBeenCalled();
			spy.mockRestore();
		});

		it("handles empty array", async () => {
			const result = await asyncUtils.mapAsync([], async (x) => x, 3);
			expect(result).toEqual([]);
		});
	});

	describe("Array.prototype extensions", () => {
		describe("mapAsync", () => {
			it("calls mapConcurrent with correct parameters", async () => {
				const spy = jest.spyOn(asyncUtils, "mapAsync").mockResolvedValue(["result"]);
				const callback = jest.fn();
				await [1, 2, 3].mapAsync(callback, 10);
				expect(spy).toHaveBeenCalledWith([1, 2, 3], callback, 10);
				spy.mockRestore();
			});

			it("uses default value for concurrencyLimit", async () => {
				const spy = jest.spyOn(asyncUtils, "mapAsync").mockResolvedValue(["result"]);
				await [1].mapAsync(jest.fn());
				expect(spy).toHaveBeenCalledWith([1], expect.any(Function), 5);
				spy.mockRestore();
			});
		});

		describe("forEachAsync", () => {
			it("calls forEachConcurrent with correct parameters", async () => {
				const spy = jest.spyOn(asyncUtils, "forEachConcurrent").mockResolvedValue(undefined);
				await [1, 2].forEachAsync(jest.fn(), 7);
				expect(spy).toHaveBeenCalledWith([1, 2], expect.any(Function), 7, undefined);
				spy.mockRestore();
			});
		});

		describe("waitAll", () => {
			it("waits for all promises", async () => {
				const promises = [Promise.resolve(1), Promise.resolve(2)];
				const result = await promises.waitAll();
				expect(result).toEqual([1, 2]);
			});

			it("rejects on first error", async () => {
				const promises = [Promise.resolve(1), Promise.reject(new Error("test error"))];
				await expect(promises.waitAll()).rejects.toThrow("test error");
			});
		});

		describe("waitAllSettled", () => {
			it("waits for all promises and returns statuses", async () => {
				const promises = [Promise.resolve(1), Promise.reject(new Error("test"))];
				const result = await promises.waitAllSettled();

				expect(result).toHaveLength(2);
				expect(result[0]).toEqual({ status: "fulfilled", value: 1 });
				expect(result[1]).toEqual({ status: "rejected", reason: expect.any(Error) });
			});
		});

		describe("waitAny", () => {
			it("returns first successful result", async () => {
				const promises = [Promise.reject(new Error("error")), Promise.resolve(42)];
				const result = await promises.waitAny();
				expect(result).toBe(42);
			});

			it("rejects if all promises are rejected", async () => {
				const promises = [Promise.reject(new Error("1")), Promise.reject(new Error("2"))];
				await expect(promises.waitAny()).rejects.toThrow();
			});
		});

		describe("waitRace", () => {
			it("returns first completed promise", async () => {
				const promises = [
					new Promise((resolve) => setTimeout(() => resolve(1), 100)),
					new Promise((resolve) => setTimeout(() => resolve(2), 50)),
				];
				const result = await promises.waitRace();
				expect(result).toBe(2);
			});

			it("rejects if first promise is rejected", async () => {
				const promises = [
					new Promise((resolve, reject) => setTimeout(() => reject(new Error("first error")), 50)),
					new Promise((resolve) => setTimeout(() => resolve(2), 100)),
				];
				await expect(promises.waitRace()).rejects.toThrow("first error");
			});
		});

		describe("supports method chaining", () => {
			it("supports method chaining", async () => {
				const result = await [1, 2, 3]
					.mapAsync(async (x) => x * 2, 2)
					.then((arr) => arr.mapAsync(async (x) => x + 1, 2));

				expect(result).toEqual([3, 5, 7]);
			});
		});
	});

	describe("edge cases", () => {
		it("preserves order during concurrent execution", async () => {
			const result = await asyncUtils.mapAsync(
				[1, 2, 3],
				async (value) => {
					await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
					return value * 2;
				},
				2,
			);

			expect(result).toEqual([2, 4, 6]);
		});

		it("correctly manages promises with large number of tasks", async () => {
			let maxConcurrent = 0;
			let currentConcurrent = 0;

			await asyncUtils.forEachConcurrent(
				Array(1000).fill(0),
				async () => {
					currentConcurrent++;
					maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
					await new Promise((resolve) => setTimeout(resolve, 1));
					currentConcurrent--;
				},
				5,
			);

			expect(maxConcurrent).toBeGreaterThan(0);
			expect(maxConcurrent).toBeLessThanOrEqual(5);
		});
	});
});
