/** @jest-environment node */
import Path from "@core/FileProvider/Path/Path";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import WorkspaceCheckIsCatalogCloning from "@ext/storage/events/WorkspaceCheckIsCatalogCloning";

jest.spyOn(GitStorage, "getAllCancelTokens").mockResolvedValue([]);

const makeEntry = (name: string, props: CatalogProps = {}) =>
	({ name, basePath: new Path(name), props }) as CatalogEntry;

const makeHarness = (opts: { saved: string[]; revive: (props: CatalogProps) => void }) => {
	const fp = { default: () => ({ rootPath: new Path("/ws") }) };
	const fs = {
		fp,
		getCatalogEntryByPath: jest.fn(async (path: Path) => makeEntry(path.value)),
	};
	const workspace = { getFileStructure: () => fs } as never;
	const rp = {
		getSavedClonePaths: jest.fn(() => opts.saved.map((s) => new Path(s))),
		cleanupProgressCache: jest.fn(),
		tryReviveCloneProgress: jest.fn((_w, _p, props: CatalogProps) => opts.revive(props)),
	} as never;

	return { fs, rp, handler: new WorkspaceCheckIsCatalogCloning(workspace, rp) };
};

describe("WorkspaceCheckIsCatalogCloning", () => {
	it("restores a pending clone that has nothing on disk yet", async () => {
		const { handler, rp } = makeHarness({
			saved: ["queued"],
			revive: (props) => {
				props.isCloning = true;
			},
		});
		const mutableEntries = { entries: [makeEntry("cloned")] };

		await handler.tryReviveCloneProgress(mutableEntries);

		expect(mutableEntries.entries.map((e) => e.name)).toEqual(["cloned", "queued"]);
		expect(
			(rp as never as { cleanupProgressCache: jest.Mock }).cleanupProgressCache.mock.calls[0][1].map(
				(p: Path) => p.value,
			),
		).toEqual(["cloned", "queued"]);
	});

	it("drops a saved clone that can no longer be revived", async () => {
		const { handler } = makeHarness({ saved: ["dead"], revive: () => {} });
		const mutableEntries = { entries: [makeEntry("cloned")] };

		await handler.tryReviveCloneProgress(mutableEntries);

		expect(mutableEntries.entries.map((e) => e.name)).toEqual(["cloned"]);
	});

	it("does not duplicate a pending clone that is already on disk", async () => {
		const { handler, fs } = makeHarness({
			saved: ["cloned"],
			revive: (props) => {
				props.isCloning = true;
			},
		});
		const mutableEntries = { entries: [makeEntry("cloned")] };

		await handler.tryReviveCloneProgress(mutableEntries);

		expect(mutableEntries.entries.map((e) => e.name)).toEqual(["cloned"]);
		expect(fs.getCatalogEntryByPath).not.toHaveBeenCalled();
	});
});
