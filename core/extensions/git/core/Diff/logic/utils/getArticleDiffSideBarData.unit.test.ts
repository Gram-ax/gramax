import Path from "@core/FileProvider/Path/Path";
import { getArticleDiffSideBarData } from "@ext/git/core/Diff/logic/utils/getArticleDiffSideBarData";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

const REPO_REL = "jira/uvedomleniya/foo.md";

type Args = Parameters<typeof getArticleDiffSideBarData>[0];

const makeArgs = (overrides: { diffPath?: string; repoPath?: string; catalogName?: string } = {}): Args => {
	const catalogName = overrides.catalogName ?? "jira";
	const repoPath = overrides.repoPath ?? REPO_REL;
	const diffPath = overrides.diffPath ?? REPO_REL;

	const article = {
		ref: { path: new Path(`${catalogName}/${repoPath}`), storageId: "test" },
		getTitle: () => "Foo",
	} as unknown as Args["article"];

	const scopedCatalog = {
		name: catalogName,
		getRepositoryRelativePath: () => new Path(repoPath),
	} as unknown as Args["scopedCatalog"];

	const diff = jest.fn().mockResolvedValue({
		files: [
			{
				path: new Path(diffPath),
				oldPath: new Path(diffPath),
				status: FileStatus.modified,
				added: 0,
				deleted: 0,
				isLfs: false,
				size: 0,
			},
		],
	});

	const gvc = {
		getCachedDiff: jest.fn().mockReturnValue(undefined),
		setCachedDiff: jest.fn(),
		diff,
	};

	const catalog = { repo: { gvc } } as unknown as Args["catalog"];

	return {
		article,
		catalog,
		scopedCatalog,
		isDeleted: false,
		pathname: "/some/pathname",
		logicPath: "some/logic/path",
	};
};

describe("getArticleDiffSideBarData", () => {
	test("preserves leading segment when it equals catalog name (real subfolder)", async () => {
		const args = makeArgs();

		const res = await getArticleDiffSideBarData(args);

		expect(res).toBeDefined();
		expect(res.data.filePath.path).toBe(REPO_REL);
		expect(res.data.filePath.oldPath).toBe(REPO_REL);
	});

	test("non-collision: repo-rel path without catalog-name prefix passes through", async () => {
		const args = makeArgs({ diffPath: "uvedomleniya/foo.md", repoPath: "uvedomleniya/foo.md" });

		const res = await getArticleDiffSideBarData(args);

		expect(res.data.filePath.path).toBe("uvedomleniya/foo.md");
	});
});
