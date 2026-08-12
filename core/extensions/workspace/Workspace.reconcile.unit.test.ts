/** @jest-environment node */
import { Workspace } from "@ext/workspace/Workspace";

type FakeThis = {
	_fs: { getCatalogEntryByPath: jest.Mock };
	_entries: Map<string, unknown>;
	refreshCatalog: jest.Mock;
	addCatalog: jest.Mock;
	removeCatalog: jest.Mock;
};

const makeThis = (overrides: Partial<FakeThis> = {}): FakeThis => ({
	_fs: { getCatalogEntryByPath: jest.fn(async () => undefined) },
	_entries: new Map(),
	refreshCatalog: jest.fn(async () => undefined),
	addCatalog: jest.fn(async () => undefined),
	removeCatalog: jest.fn(async () => undefined),
	...overrides,
});

const reconcile = (self: FakeThis, name: string) =>
	(Workspace.prototype.reconcileCatalogFromDisk as (this: FakeThis, name: string) => Promise<string>).call(
		self,
		name,
	);

describe("Workspace.reconcileCatalogFromDisk", () => {
	it("refreshes when the catalog exists on disk and in memory", async () => {
		const self = makeThis({
			_fs: { getCatalogEntryByPath: jest.fn(async () => ({ load: jest.fn() })) },
			_entries: new Map([["docs", {}]]),
		});

		expect(await reconcile(self, "docs")).toBe("refreshed");
		expect(self.refreshCatalog).toHaveBeenCalledWith("docs");
		expect(self.removeCatalog).not.toHaveBeenCalled();
	});

	it("adds when the catalog exists on disk but not in memory (new clone on a peer)", async () => {
		const loaded = {};
		const entry = { load: jest.fn(async () => loaded) };
		const self = makeThis({ _fs: { getCatalogEntryByPath: jest.fn(async () => entry) } });

		expect(await reconcile(self, "docs")).toBe("added");
		expect(self.addCatalog).toHaveBeenCalledWith(loaded);
	});

	it("removes from memory when the catalog is gone from disk", async () => {
		const self = makeThis({ _entries: new Map([["docs", {}]]) });

		expect(await reconcile(self, "docs")).toBe("removed");
		expect(self.removeCatalog).toHaveBeenCalledWith("docs", false);
	});

	it("returns not-found when the catalog is neither on disk nor in memory", async () => {
		const self = makeThis();

		expect(await reconcile(self, "docs")).toBe("not-found");
		expect(self.refreshCatalog).not.toHaveBeenCalled();
		expect(self.addCatalog).not.toHaveBeenCalled();
		expect(self.removeCatalog).not.toHaveBeenCalled();
	});

	it("rejects path-traversal names without touching disk", async () => {
		for (const name of ["../secret", "..\\secret", "a/b", "..", "."]) {
			const self = makeThis({ _entries: new Map([[name, {}]]) });

			expect(await reconcile(self, name)).toBe("not-found");
			expect(self._fs.getCatalogEntryByPath).not.toHaveBeenCalled();
			expect(self.refreshCatalog).not.toHaveBeenCalled();
			expect(self.removeCatalog).not.toHaveBeenCalled();
		}
	});
});
