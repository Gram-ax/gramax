import { WorkspaceState } from "./WorkspaceState";

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

describe("WorkspaceState catalog indexing", () => {
	describe("single caller", () => {
		it("acquires lock and returns release function", async () => {
			const state = new WorkspaceState("workspace", true);

			const release = await state.startCatalogIndexing("products-legacy");

			expect(release).toBeInstanceOf(Function);
			release!();
		});

		it("fresh call after release gets a new lock", async () => {
			const state = new WorkspaceState("workspace", true);

			const r1 = (await state.startCatalogIndexing("products-legacy"))!;
			r1();

			const r2 = await state.startCatalogIndexing("products-legacy");
			expect(r2).toBeInstanceOf(Function);
			r2!();
		});
	});

	describe("concurrent callers on same catalog", () => {
		it("second caller waits until first releases", async () => {
			const state = new WorkspaceState("workspace", true);

			const r1 = (await state.startCatalogIndexing("products-legacy"))!;

			let secondDone = false;
			const p2 = state.startCatalogIndexing("products-legacy").then((r) => {
				secondDone = true;
				return r;
			});

			await tick();
			expect(secondDone).toBe(false);

			r1();

			const r2 = await p2;
			expect(secondDone).toBe(true);
			expect(r2).toBeInstanceOf(Function);
			r2!();
		});

		it("third caller skips when second is already queued", async () => {
			const state = new WorkspaceState("workspace", true);

			const r1 = (await state.startCatalogIndexing("products-legacy"))!;
			const p2 = state.startCatalogIndexing("products-legacy");

			const r3 = await state.startCatalogIndexing("products-legacy");
			expect(r3).toBeNull();

			r1();
			(await p2)!();
		});
	});

	describe("independent catalogs", () => {
		it("acquire locks independently without blocking each other", async () => {
			const state = new WorkspaceState("workspace", true);

			const rA = (await state.startCatalogIndexing("a"))!;
			const rB = (await state.startCatalogIndexing("b"))!;

			rA();
			rB();
		});

		it("queue on catalog A does not block catalog B", async () => {
			const state = new WorkspaceState("workspace", true);

			const rA = (await state.startCatalogIndexing("a"))!;
			const pA2 = state.startCatalogIndexing("a");
			const rB = (await state.startCatalogIndexing("b"))!;

			rB();

			let a2Done = false;
			// biome-ignore lint/nursery/noFloatingPromises: idc
			pA2.then(() => {
				a2Done = true;
			});

			await tick();
			expect(a2Done).toBe(false);

			rA();
			(await pA2)!();
		});
	});

	describe("full chain", () => {
		it("first → queued → skipped → resolve → queued → resolve → clean", async () => {
			const state = new WorkspaceState("workspace", true);

			const r1 = (await state.startCatalogIndexing("c"))!;
			const p2 = state.startCatalogIndexing("c");
			expect(await state.startCatalogIndexing("c")).toBeNull();

			r1();
			const r2 = await p2;

			const p4 = state.startCatalogIndexing("c");
			let p4Done = false;
			// biome-ignore lint/nursery/noFloatingPromises: idc
			p4.then(() => {
				p4Done = true;
			});

			await tick();
			expect(p4Done).toBe(false);

			r2!();

			const r4 = await p4;
			expect(p4Done).toBe(true);
			r4!();

			const r5 = await state.startCatalogIndexing("c");
			expect(r5).toBeInstanceOf(Function);
			r5!();
		});
	});

	describe("semaphore concurrency cap", () => {
		it("allows up to 5 different catalogs concurrently", async () => {
			const state = new WorkspaceState("workspace", true);

			const releases = await Promise.all([
				state.startCatalogIndexing("a"),
				state.startCatalogIndexing("b"),
				state.startCatalogIndexing("c"),
				state.startCatalogIndexing("d"),
				state.startCatalogIndexing("e"),
			]);

			for (const r of releases) {
				expect(r).toBeInstanceOf(Function);
			}

			for (const r of releases) {
				r!();
			}
		});

		it("6th different catalog waits for a semaphore slot", async () => {
			const state = new WorkspaceState("workspace", true);

			const releases = await Promise.all([
				state.startCatalogIndexing("a"),
				state.startCatalogIndexing("b"),
				state.startCatalogIndexing("c"),
				state.startCatalogIndexing("d"),
				state.startCatalogIndexing("e"),
			]);

			const p6 = state.startCatalogIndexing("f");
			let sixthDone = false;
			// biome-ignore lint/nursery/noFloatingPromises: idc
			p6.then(() => {
				sixthDone = true;
			});

			await tick();
			expect(sixthDone).toBe(false);

			releases[0]!();

			const r6 = await p6;
			expect(sixthDone).toBe(true);
			expect(r6).toBeInstanceOf(Function);

			r6!();
			for (let i = 1; i < 5; i++) {
				releases[i]!();
			}
		});
	});
});
