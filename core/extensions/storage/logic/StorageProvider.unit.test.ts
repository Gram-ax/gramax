/** @jest-environment node */
import StorageProvider from "@ext/storage/logic/StorageProvider";

const MAX_CONCURRENT = 3;

type Deferred = { promise: Promise<unknown>; resolve: () => void; reject: (e: Error) => void };

const defer = (): Deferred => {
	let resolve: () => void;
	let reject: (e: Error) => void;
	const promise = new Promise<unknown>((res, rej) => {
		resolve = () => res(null);
		reject = rej;
	});
	// the queue only reaches these through Promise.race, which does not count as handling a rejection
	promise.catch(() => null);
	return { promise, resolve, reject };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// the queue is private; the test drives it directly because there is no public way to occupy a slot
type QueueInternals = { [method: string]: (...args: unknown[]) => Promise<unknown> };

const takeSlot = (sp: StorageProvider, started: string[], name: string, d: Deferred) =>
	(sp as never as QueueInternals)
		._takeSlot(() => {
			started.push(name);
			return d.promise;
		})
		.catch(() => null);

describe("StorageProvider clone queue", () => {
	it("never runs more clones at once than the limit allows", async () => {
		const sp = new StorageProvider();
		const started: string[] = [];
		const clones = Array.from({ length: 6 }, () => defer());

		// every clone is requested in the same tick, the way a workspace clones its catalogs
		const slots = clones.map((d, i) => takeSlot(sp, started, `rep-${i}`, d));

		await flush();
		expect(started).toEqual(["rep-0", "rep-1", "rep-2"]);

		clones[0].resolve();
		await flush();

		expect(started).toHaveLength(MAX_CONCURRENT + 1);
		expect(started).toContain("rep-3");

		for (const clone of clones) clone.resolve();
		await Promise.all(slots);
		expect(started).toHaveLength(clones.length);
	});

	it("hands the freed slot to the queue when a clone fails", async () => {
		const sp = new StorageProvider();
		const started: string[] = [];
		const clones = Array.from({ length: 4 }, () => defer());

		const slots = clones.map((d, i) => takeSlot(sp, started, `rep-${i}`, d));

		await flush();
		clones[0].reject(new Error("clone failed"));
		await flush();

		expect(started).toContain("rep-3");

		for (const clone of clones.slice(1)) clone.resolve();
		await Promise.all(slots);
	});
});
