import GitDiffItemAliases from "@ext/git/core/GitDiffItemCreator/GitDiffItemAliases";
import DiffFile from "@ext/VersionControl/model/DiffFile";

type TestDiffFile = Pick<DiffFile, "filePath" | "title">;

describe("GitDiffItemAliases", () => {
	it("применяет алиасы", () => {
		const diffFiles: TestDiffFile[] = [
			{ filePath: { path: ".gramax/mr/open.yaml" }, title: "open.yaml" },
			{ filePath: { path: "1.md" }, title: "Title 1" },
		];

		GitDiffItemAliases.applyAliases(diffFiles as any);

		expect(diffFiles).toEqual([
			{ filePath: { path: ".gramax/mr/open.yaml" }, title: "Merge Request" },
			{ filePath: { path: "1.md" }, title: "Title 1" },
		]);
	});
});
