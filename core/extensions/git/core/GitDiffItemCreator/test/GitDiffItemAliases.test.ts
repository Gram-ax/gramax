import GitDiffItemAliasApplier from "@ext/git/core/GitDiffItemCreator/GitDiffItemAliasApplier";
import { DiffFile } from "@ext/VersionControl/model/Diff";

type TestDiffFile = Pick<DiffFile, "filePath" | "title">;

describe("GitDiffItemAliases", () => {
	test("применяет алиасы", () => {
		const diffFiles: TestDiffFile[] = [
			{ filePath: { path: ".gramax/mr/open.yaml" }, title: "open.yaml" },
			{ filePath: { path: "1.md" }, title: "Title 1" },
		];

		GitDiffItemAliasApplier.apply(diffFiles as any);

		expect(diffFiles).toEqual([
			{ filePath: { path: ".gramax/mr/open.yaml" }, title: "Merge Request" },
			{ filePath: { path: "1.md" }, title: "Title 1" },
		]);
	});
});
