/**
 * @jest-environment node
 */

import getApp from "@app/node/app";
import TestContext from "@app/test/TestContext";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import RevisionDiffItemCreator from "@ext/git/core/GitDiffItemCreator/RevisionDiffItemCreator";
import repTestUtils from "@ext/git/core/GitDiffItemCreator/test/repTestUtils";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import { TEST_GIT_CATALOG_PATH } from "@ext/git/test/testGitCatalogPath";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
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

const getRefCatalogs = async (catalog: Catalog, oldRef: GitVersion, newRef: GitVersion, fs: FileStructure) => {
	const catalogPath = catalog.basePath;
	const oldScope = GitTreeFileProvider.scoped(catalogPath, { commit: oldRef.toString() });
	const newScope = GitTreeFileProvider.scoped(catalogPath, { commit: newRef.toString() });
	const scopeGit = new GitCommands(fs.fp.default(), catalogPath);
	fs.fp.mount(oldScope, new GitTreeFileProvider(scopeGit));
	fs.fp.mount(newScope, new GitTreeFileProvider(scopeGit));
	const oldCatalog = await fs.getCatalogByPath(oldScope, false);
	const newCatalog = await fs.getCatalogByPath(newScope, false);
	return { oldCatalog, newCatalog };
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
			const { oldCatalog, newCatalog } = await getRefCatalogs(catalog, oldRef, newRef, fs);
			const gitDiffItemCreator = new RevisionDiffItemCreator(
				catalog,
				sitePresenter,
				fs,
				{ type: "tree", old: oldRef.toString(), new: newRef.toString() },
				oldCatalog,
				newCatalog,
				articleParser,
			);
			await catalog.update();

			const res = await gitDiffItemCreator.getDiffItems();

			expect(res.items.map((x) => ({ path: x.filePath.path, type: x.status }))).toEqual([
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
			const { oldCatalog, newCatalog } = await getRefCatalogs(catalog, oldRef, newRef, fs);
			const gitDiffItemCreator = new RevisionDiffItemCreator(
				catalog,
				sitePresenter,
				fs,
				{ type: "tree", old: oldRef.toString(), new: newRef.toString() },
				oldCatalog,
				newCatalog,
				articleParser,
			);
			await catalog.update();

			const data = await gitDiffItemCreator.getDiffItems();
			const items = data.items.map((x) => ({
				filePath: { path: x.filePath.path, oldPath: x.filePath.oldPath },
				resources: x.resources.map((r) => ({
					path: { path: r.filePath.path, oldPath: r.filePath.oldPath },
					title: r.title,
					type: r.status,
				})),
			}));
			const resources = data.resources.map((x) => ({
				path: { path: x.filePath.path, oldPath: x.filePath.oldPath },
				title: x.title,
				type: x.status,
			}));

			expect(items.length).toEqual(1);
			expect(items[0].resources).toEqual([
				{ path: { path: "imgs/2.png", oldPath: "imgs/2.png" }, title: "2.png", type: FileStatus.modified },
				{
					path: { path: "imgs/3.png", oldPath: "imgs/4.png" },
					title: "3.png",
					type: FileStatus.rename,
				},
			]);
			expect(resources.length).toEqual(2);
			expect(resources).toContainEqual({
				path: { path: "imgs/1.png", oldPath: "imgs/1.png" },
				title: "1.png",
				type: FileStatus.delete,
			});
			expect(resources).toContainEqual({
				path: { path: "imgs/2_1.png", oldPath: "imgs/2_1.png" },
				title: "2_1.png",
				type: FileStatus.delete,
			});
		});

		test("с переименованием", async () => {
			const { catalog, dfp, git, fs, sitePresenter, articleParser } = await getGitDiffItemCreatorData();
			const oldRef = await git.getHeadCommit();

			await repTestUtils.makeRenameChanges(dfp);
			await git.add(), await git.commit("", mockUserData);

			const newRef = await git.getHeadCommit();
			const { oldCatalog, newCatalog } = await getRefCatalogs(catalog, oldRef, newRef, fs);
			const gitDiffItemCreator = new RevisionDiffItemCreator(
				catalog,
				sitePresenter,
				fs,
				{ type: "tree", old: oldRef.toString(), new: newRef.toString() },
				oldCatalog,
				newCatalog,
				articleParser,
			);
			await catalog.update();

			const res = await gitDiffItemCreator.getDiffItems();

			expect(res.items.length).toEqual(1);
			expect(res.items[0].hunks).not.toBeUndefined();
			expect(res.items.map((x) => ({ filePath: x.filePath }))).toEqual([
				{
					filePath: {
						hunks: [
							{ value: "_index", type: undefined },
							{ value: "2", type: FileStatus.new },
							{ value: ".md", type: undefined },
						],
						path: "_index2.md",
						oldPath: "_index.md",
					} as DiffFilePaths,
				},
			]);
		});
	});
});
