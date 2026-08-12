import FsEventsBatcher from "@ext/Watchers/FsEventsBatcher";

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("FsEventsBatcher", () => {
	test("does not run flushes concurrently", async () => {
		let releaseFirst!: () => void;
		const firstFlush = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});
		const batches: string[][] = [];

		const batcher = new FsEventsBatcher<string>(async (events) => {
			batches.push(events);
			if (batches.length === 1) await firstFlush;
		});

		batcher.enqueue(["a"]);
		const flushPromise = batcher.flushNow();
		await tick();

		batcher.enqueue(["b"]);
		batcher.enqueue(["c"]);
		await tick();

		expect(batches).toEqual([["a"]]);

		releaseFirst();
		await flushPromise;

		expect(batches).toEqual([["a"], ["b", "c"]]);
	});

	test("keeps queued events while flushing is paused", async () => {
		let paused = true;
		const batches: string[][] = [];
		const batcher = new FsEventsBatcher<string>(
			(events) => {
				batches.push(events);
			},
			{ canFlush: () => !paused },
		);

		batcher.enqueue(["a"]);
		await batcher.flushNow();
		expect(batches).toEqual([]);

		batcher.enqueue(["b"]);
		paused = false;
		await batcher.flushNow();

		expect(batches).toEqual([["a", "b"]]);
	});
});

describe("FsEventsBatcher timers", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	test("stop() drops the queue and blocks any further flush", async () => {
		const batches: string[][] = [];
		const batcher = new FsEventsBatcher<string>((events) => {
			batches.push(events);
		});

		batcher.enqueue(["a"]); // queued + debounce timer armed
		batcher.stop();

		jest.advanceTimersByTime(2000); // the armed timer must have been cleared by stop()
		expect(batches).toEqual([]);

		batcher.enqueue(["b"]); // ignored while stopped
		await batcher.flushNow(); // no-op while stopped
		expect(batches).toEqual([]);
	});

	test("flushes at maxDelayMs even while the debounce keeps getting reset", async () => {
		const batches: string[][] = [];
		const batcher = new FsEventsBatcher<string>(
			(events) => {
				batches.push(events);
			},
			{ flushDelayMs: 100, maxDelayMs: 250 },
		);

		batcher.enqueue(["a"]); // t=0: first event stamped, debounce armed @100
		jest.advanceTimersByTime(90);
		batcher.enqueue(["b"]); // t=90: still < maxDelay, debounce rearmed @190
		jest.advanceTimersByTime(90);
		batcher.enqueue(["c"]); // t=180: still < maxDelay, debounce rearmed @280
		jest.advanceTimersByTime(90);
		batcher.enqueue(["d"]); // t=270: 270 >= maxDelay(250) → flush now, debounce never fired

		await Promise.resolve(); // let the flushNow microtask settle
		expect(batches).toEqual([["a", "b", "c", "d"]]);
	});
});
