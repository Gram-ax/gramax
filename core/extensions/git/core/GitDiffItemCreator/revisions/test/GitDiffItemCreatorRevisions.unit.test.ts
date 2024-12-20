/**
 * @jest-environment node
 */

import getApp from "@app/node/app";
import TestContext from "@app/test/TestContext";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitDiffItemCreatorRevisions from "@ext/git/core/GitDiffItemCreator/revisions/GitDiffItemCreatorRevisions";
import repTestUtils from "@ext/git/core/GitDiffItemCreator/test/repTestUtils";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { TEST_GIT_CATALOG_PATH } from "@ext/git/test/testGitCatalogPath";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import util from "util";

global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};

const getGitDiffItemCreatorData = async () => {
	const { wm, rp, sitePresenterFactory, parser, parserContextFactory } = await getApp();
	const ctx = new TestContext();
	const articleParser = new ArticleParser(ctx, parser, parserContextFactory);
	const dfp = new DiskFileProvider(TEST_GIT_CATALOG_PATH);
	const workspace = wm.current();
	const catalog = await workspace.getContextlessCatalog("gitCatalog");
	const fs = workspace.getFileStructure();
	const fp = workspace.getFileProvider();
	const sitePresenter = sitePresenterFactory.fromContext(ctx);
	const git = new GitCommands(dfp, new Path());

	return { catalog, dfp, fs, fp, rp, git, sitePresenter, articleParser };
};

describe("GitDiffItemCreator ", () => {
	describe("выдаёт DiffItems", () => {
		afterEach(async () => {
			const { dfp, git } = await getGitDiffItemCreatorData();
			const gvc = new GitVersionControl(new Path(), dfp);
			await gvc.restoreRepositoryState();
			await repTestUtils.clearChanges(dfp, git);
			await repTestUtils.clearRenameChanges(dfp, git);
			await repTestUtils.clearResourceChanges(dfp, git);
		});
		test("без изменения ресурсов", async () => {
			const { catalog, dfp, git, fs, sitePresenter, articleParser } = await getGitDiffItemCreatorData();
			const oldRef = await git.getHeadCommit();

			await repTestUtils.makeChanges(dfp);
			await git.add(), await git.commit("", mockUserData);

			const newRef = await git.getHeadCommit();
			const gitDiffItemCreator = new GitDiffItemCreatorRevisions(
				catalog,
				sitePresenter,
				fs,
				oldRef,
				newRef,
				articleParser,
			);
			await catalog.update();

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
			const { catalog, dfp, git, fs, sitePresenter, articleParser } = await getGitDiffItemCreatorData();
			const oldRef = await git.getHeadCommit();

			await repTestUtils.makeResourceChanges(dfp);
			await git.add(), await git.commit("", mockUserData);

			const newRef = await git.getHeadCommit();
			const gitDiffItemCreator = new GitDiffItemCreatorRevisions(
				catalog,
				sitePresenter,
				fs,
				oldRef,
				newRef,
				articleParser,
			);
			await catalog.update();

			const data = await gitDiffItemCreator.getDiffItems();
			const resources = data.resources.map((x) => ({
				path: x.filePath.path,
				title: x.title,
				type: x.changeType,
			}));

			expect(data.items).toEqual([]);
			expect(resources.length).toEqual(5);
			expect(resources).toContainEqual({ path: "imgs/1.png", title: "1.png", type: FileStatus.delete });
			expect(resources).toContainEqual({ path: "imgs/2.png", title: "2.png", type: FileStatus.modified });
			expect(resources).toContainEqual({ path: "imgs/2_1.png", title: "2_1.png", type: FileStatus.delete });
			expect(resources).toContainEqual({ path: "imgs/3.png", title: "3.png", type: FileStatus.new });
			expect(resources).toContainEqual({ path: "imgs/4.png", title: "4.png", type: FileStatus.delete });
		});

		test("с переименованием", async () => {
			const { catalog, dfp, git, fs, sitePresenter, articleParser } = await getGitDiffItemCreatorData();
			const oldRef = await git.getHeadCommit();

			await repTestUtils.makeRenameChanges(dfp);
			await git.add(), await git.commit("", mockUserData);

			const newRef = await git.getHeadCommit();
			const gitDiffItemCreator = new GitDiffItemCreatorRevisions(
				catalog,
				sitePresenter,
				fs,
				oldRef,
				newRef,
				articleParser,
			);
			await catalog.update();

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
