/**
 * @jest-environment node
 */

import getApp from "@app/node/app";
import TestContext from "@app/test/TestContext";
import Path from "@core/FileProvider/Path/Path";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import util from "util";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import { FileStatus } from "../../../../Watchers/model/FileStatus";
import { TEST_GIT_CATALOG_PATH } from "../../../test/testGitCatalogPath";
import GitDiffItemCreator from "../GitDiffItemCreator";
import repTestUtils from "./repTestUtils";

global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

const getGitDiffItemCreatorData = async () => {
	const { wm, rp, sitePresenterFactory } = await getApp();
	const dfp = new DiskFileProvider(TEST_GIT_CATALOG_PATH);
	const workspace = wm.current();
	const catalog = await workspace.getCatalog("gitCatalog");
	const fs = workspace.getFileStructure();
	const fp = workspace.getFileProvider();
	const sitePresenter = sitePresenterFactory.fromContext(new TestContext());
	const gitDiffItemCreator = new GitDiffItemCreator(catalog, fp as DiskFileProvider, sitePresenter, fs);
	const git = new GitCommands(dfp, new Path());

	return { catalog, dfp, gitDiffItemCreator, fs, fp, rp, git };
};

describe("GitDiffItemCreator ", () => {
	describe("выдаёт DiffItems", () => {
		afterEach(async () => {
			const { dfp, git } = await getGitDiffItemCreatorData();
			await repTestUtils.clearChanges(dfp, git);
			await repTestUtils.clearRenameChanges(dfp, git);
			await repTestUtils.clearResourceChanges(dfp, git);
		});
		test("без изменения ресурсов", async () => {
			const { catalog, dfp, gitDiffItemCreator, rp } = await getGitDiffItemCreatorData();
			await repTestUtils.makeChanges(dfp);
			await catalog.update(rp);

			const res = await gitDiffItemCreator.getDiffItems();

			expect(res.items.map((x) => ({ path: x.filePath.path, type: x.changeType }))).toEqual([
				{ path: "1.md", type: FileStatus.delete },
				{ path: "2.md", type: FileStatus.modified },
				{ path: "4.md", type: FileStatus.new },
				{ path: "category/_index.md", type: FileStatus.delete },
				{ path: "category/articleTest.md", type: FileStatus.modified },
				{ path: "category/articleTest2.md", type: FileStatus.new },
			]);
		});
		test("с изменением ресурсов", async () => {
			const { catalog, dfp, gitDiffItemCreator, rp } = await getGitDiffItemCreatorData();
			await repTestUtils.makeResourceChanges(dfp);
			await catalog.update(rp);

			const data = await gitDiffItemCreator.getDiffItems();
			const res = data.items.map((x) => ({
				filePath: x.filePath.path,
				resources: x.resources.map((r) => ({ path: r.filePath.path, title: r.title, type: r.changeType })),
			}));

			expect(res).toEqual([
				{
					filePath: "file-with-resource.md",
					resources: [
						{ path: "imgs/1.png", title: "1.png", type: FileStatus.delete },
						{ path: "imgs/2.png", title: "2.png", type: FileStatus.modified },
						{ path: "imgs/3.png", title: "3.png", type: FileStatus.new },
					],
				},
			]);
		});

		test("с отдельными ресурсами", async () => {
			const { catalog, dfp, gitDiffItemCreator, rp } = await getGitDiffItemCreatorData();
			await repTestUtils.makeResourceChanges(dfp);
			await catalog.update(rp);

			const data = await gitDiffItemCreator.getDiffItems();
			const res = data.resources.map((x) => ({ path: x.filePath.path, title: x.title }));

			expect(res).toEqual([
				{ path: "imgs/2_1.png", title: "2_1.png" },
				{ path: "imgs/4.png", title: "4.png" },
			]);
			expect(data.items.length).toEqual(1);
			const hasItemDiffs = data.items[0].diff.changes[0].type;
			expect(hasItemDiffs).toBeFalsy();
		});

		test("с переименованием", async () => {
			const { catalog, dfp, gitDiffItemCreator, rp } = await getGitDiffItemCreatorData();
			await repTestUtils.makeRenameChanges(dfp);
			await catalog.update(rp);

			const res = await gitDiffItemCreator.getDiffItems();

			expect(res.items.length).toEqual(1);
			expect(res.items[0].diff).not.toBeUndefined();
			expect(res.items.map((x) => ({ filePath: x.filePath }))).toEqual([
				{
					filePath: {
						diff: [
							{ value: "_index", type: undefined },
							{ value: "2", type: FileStatus.new },
							{ value: ".md", type: undefined },
						],
						path: "_index2.md",
						oldPath: "_index.md",
					},
				},
			]);
		});
	});
});
