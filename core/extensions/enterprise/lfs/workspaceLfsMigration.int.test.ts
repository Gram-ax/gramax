/** biome-ignore-all lint/suspicious/noExplicitAny: minimal Catalog/Workspace stubs for int harness */
/**
 * @jest-environment node
 */

import { execSync } from "node:child_process";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import {
	applyWorkspaceLfsMigration,
	getWorkspaceLfsDivergence,
	getWorkspaceLfsMigrationStats,
} from "@ext/enterprise/lfs/workspaceLfsMigration";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const pushMock = jest.spyOn(GitStorage.prototype, "push").mockImplementation(() => Promise.resolve());
jest.spyOn(GitCommands.prototype, "fetch").mockImplementation(() => Promise.resolve());

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};

const path = (p: string) => new Path(p);
const repPath = (p: string) => new Path(["testLfsRep", p]);
const dfp = new DiskFileProvider(__dirname);
const sh = (cmd: string) => execSync(cmd, { cwd: dfp.rootPath.join(path("testLfsRep")).value }).toString();
const treeFiles = () => sh("git ls-tree -r --name-only HEAD").split("\n").filter(Boolean).sort();
const blob = (file: string) => sh(`git show HEAD:${file}`);
const isLfsPointer = (file: string) => blob(file).includes("version https://git-lfs.github.com/spec/v1");

let repo: WorkdirRepository;

const makeCatalog = () =>
	({
		repo,
		getRootCategoryPath: () => path("testLfsRep"),
		getRelativeRootCategoryPath: () => new Path(""),
	}) as any;

const makeWorkspace = (patterns?: string[]) =>
	({
		config: () => Promise.resolve({ git: patterns ? { lfs: { patterns } } : undefined }),
		getFileProvider: () => dfp,
	}) as any;

describe("workspaceLfsMigration", () => {
	beforeEach(async () => {
		await RepositoryProvider.resetRepo();
		await dfp.mkdir(path("testLfsRep"));
		await GitVersionControl.init(dfp, path("testLfsRep"), mockUserData);
		const gvc = new GitVersionControl(path("testLfsRep"), dfp);
		const storage = new GitStorage(path("testLfsRep"), dfp);
		repo = new WorkdirRepository(path("testLfsRep"), dfp, gvc, storage);
		await dfp.write(repPath("article.md"), "# hi");
		await repo.publish({ commitMessage: "init", data: mockUserData, filesToPublish: [path("article.md")] });
		// the initial fixture publish above also calls storage.push — clear it here so
		// per-test push-call assertions only observe pushes triggered by the test itself.
		pushMock.mockClear();
	});

	afterEach(async () => {
		await RepositoryProvider.resetRepo();
		await dfp.delete(path("testLfsRep"));
		repo = null;
	});

	test("no config -> no divergence", async () => {
		const d = await getWorkspaceLfsDivergence(makeWorkspace(undefined), makeCatalog());
		expect(d).toEqual({ added: [], removed: [], legacyStaged: false });
	});

	test("detects divergence against empty .gitattributes", async () => {
		const d = await getWorkspaceLfsDivergence(makeWorkspace(["*.psd"]), makeCatalog());
		expect(d).toEqual({
			added: ["*.psd"],
			removed: [],
			legacyStaged: false,
			fileDiff: { before: "", after: "*.psd filter=lfs\n" },
		});
	});

	test("migration stats count tracked matching files and sum their size", async () => {
		await dfp.write(repPath("a.psd"), "x".repeat(1000));
		await dfp.write(repPath("nested/b.psd"), "y".repeat(24));
		await dfp.write(repPath("c.txt"), "not matching");
		await repo.publish({
			commitMessage: "files",
			data: mockUserData,
			filesToPublish: [path("a.psd"), path("nested/b.psd"), path("c.txt")],
		});

		const stats = await getWorkspaceLfsMigrationStats(makeWorkspace(["*.psd"]), makeCatalog());
		expect(stats).toEqual({ fileCount: 2, totalSize: 1024 });
	});

	test("migration stats skip files with uncommitted workdir changes", async () => {
		await dfp.write(repPath("a.psd"), "x".repeat(1000));
		await dfp.write(repPath("b.psd"), "y".repeat(24));
		await repo.publish({
			commitMessage: "files",
			data: mockUserData,
			filesToPublish: [path("a.psd"), path("b.psd")],
		});
		await dfp.write(repPath("b.psd"), "edited");

		const stats = await getWorkspaceLfsMigrationStats(makeWorkspace(["*.psd"]), makeCatalog());
		expect(stats).toEqual({ fileCount: 1, totalSize: 1000 });
	});

	test("migration stats are empty when nothing diverged", async () => {
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);
		const stats = await getWorkspaceLfsMigrationStats(makeWorkspace(["*.psd"]), makeCatalog());
		expect(stats).toEqual({ fileCount: 0, totalSize: 0 });
	});

	test("fileDiff preview keeps non-lfs attributes and shows target state", async () => {
		await dfp.write(repPath(".gitattributes"), "*.md diff=markdown\n*.png filter=lfs");
		await repo.publish({ commitMessage: "attrs", data: mockUserData, filesToPublish: [path(".gitattributes")] });

		const d = await getWorkspaceLfsDivergence(makeWorkspace(["*.psd"]), makeCatalog());
		expect(d.added).toEqual(["*.psd"]);
		expect(d.removed).toEqual(["*.png"]);
		expect(d.fileDiff.before).toBe("*.md diff=markdown\n*.png filter=lfs\n");
		expect(d.fileDiff.after).toContain("*.md diff=markdown");
		expect(d.fileDiff.after).toContain("*.psd filter=lfs");
		expect(d.fileDiff.after).not.toContain("*.png");
	});

	test("apply writes isolated commit and pushes, workdir stays clean", async () => {
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);

		expect(pushMock).toHaveBeenCalledTimes(1);
		const after = await getWorkspaceLfsDivergence(makeWorkspace(["*.psd"]), makeCatalog());
		expect(after).toEqual({ added: [], removed: [], legacyStaged: false });
		expect(await repo.gvc.getChanges("workdir")).toEqual([]);
		expect(await dfp.read(repPath(".gitattributes"))).toContain("*.psd filter=lfs");
	});

	test("apply is no-op when nothing diverged", async () => {
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);
		pushMock.mockClear();
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);
		expect(pushMock).not.toHaveBeenCalled();
	});

	test("legacyStaged detected when .gitattributes staged but patterns already match", async () => {
		// emulate legacy version: file written and staged, but not committed
		await dfp.write(repPath(".gitattributes"), "*.psd filter=lfs\n");
		await repo.gvc.add([path(".gitattributes")]);
		const d = await getWorkspaceLfsDivergence(makeWorkspace(["*.psd"]), makeCatalog());
		expect(d).toEqual({ added: [], removed: [], legacyStaged: true });
	});

	test("apply absorbs legacy staged file into service commit", async () => {
		await dfp.write(repPath(".gitattributes"), "*.psd filter=lfs\n");
		await repo.gvc.add([path(".gitattributes")]);
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);
		expect(await repo.gvc.getChanges("workdir")).toEqual([]);
		expect(await repo.gvc.getChanges("index")).toEqual([]);
	});

	test("commit failure rolls back .gitattributes, no trace in workdir", async () => {
		const commitSpy = jest.spyOn(GitVersionControl.prototype, "commit").mockRejectedValueOnce(new Error("boom"));
		await expect(applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData)).rejects.toThrow(
			"boom",
		);
		commitSpy.mockRestore();

		expect(await repo.gvc.getChanges("workdir")).toEqual([]);
		expect(await repo.gvc.getChanges("index")).toEqual([]);
	});

	test("push failure keeps local commit, no rethrow of workdir garbage", async () => {
		pushMock.mockRejectedValueOnce(new Error("offline"));
		await expect(applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData)).rejects.toThrow(
			"offline",
		);
		// commit is created, workdir is clean, no more divergence
		expect(await repo.gvc.getChanges("workdir")).toEqual([]);
		const after = await getWorkspaceLfsDivergence(makeWorkspace(["*.psd"]), makeCatalog());
		expect(after.added).toEqual([]);
	});

	test("existing non-lfs attributes survive", async () => {
		await dfp.write(repPath(".gitattributes"), "*.md diff=markdown\n");
		await repo.publish({ commitMessage: "attrs", data: mockUserData, filesToPublish: [path(".gitattributes")] });
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);
		const raw = await dfp.read(repPath(".gitattributes"));
		expect(raw).toContain("*.md diff=markdown");
		expect(raw).toContain("*.psd filter=lfs");
	});

	test("service commit carries matching committed files, not .gitattributes alone", async () => {
		await dfp.write(repPath("img.psd"), "psd-content");
		await dfp.write(repPath("sub/pic.psd"), "psd-content-2");
		await repo.publish({
			commitMessage: "add psd",
			data: mockUserData,
			filesToPublish: [path("img.psd"), path("sub/pic.psd")],
		});

		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);

		// both psd files went through the LFS clean filter; article.md matches no pattern and is untouched
		expect({
			tree: treeFiles(),
			img: isLfsPointer("img.psd"),
			pic: isLfsPointer("sub/pic.psd"),
			article: blob("article.md"),
		}).toEqual({
			tree: [".gitattributes", "article.md", "img.psd", "sub/pic.psd"],
			img: true,
			pic: true,
			article: "# hi",
		});
	});

	test("service commit skips untracked, ignored and locally modified files", async () => {
		await dfp.write(repPath("committed.psd"), "psd-content");
		await dfp.write(repPath("modified.psd"), "psd-content-2");
		await dfp.write(repPath(".gitignore"), "ignored/\n");
		await repo.publish({
			commitMessage: "add psd",
			data: mockUserData,
			filesToPublish: [path("committed.psd"), path("modified.psd"), path(".gitignore")],
		});

		// user's pending work — must not be swept into the service commit
		await dfp.write(repPath("draft.psd"), "not-published-yet");
		await dfp.write(repPath("ignored/local.psd"), "ignored-content");
		await dfp.write(repPath("modified.psd"), "psd-content-2-edited");

		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);

		// draft.psd and ignored/local.psd never enter the repository; modified.psd keeps the blob it
		// was published with, so the uncommitted edit stayed out of the service commit
		expect({
			tree: treeFiles(),
			committed: isLfsPointer("committed.psd"),
			modified: blob("modified.psd"),
			workdir: await dfp.read(repPath("modified.psd")),
		}).toEqual({
			tree: [".gitattributes", ".gitignore", "article.md", "committed.psd", "modified.psd"],
			committed: true,
			modified: "psd-content-2",
			workdir: "psd-content-2-edited",
		});
	});

	test("apply re-adds affected files into the service commit; unrelated workdir changes stay untouched", async () => {
		await dfp.write(repPath("img.psd"), "psd-content");
		await repo.publish({ commitMessage: "add psd", data: mockUserData, filesToPublish: [path("img.psd")] });
		pushMock.mockClear();

		// unrelated, uncommitted user change — must survive the migration untouched
		await dfp.write(repPath("article.md"), "# updated, uncommitted");

		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);

		expect(await dfp.read(repPath(".gitattributes"))).toContain("*.psd filter=lfs");

		// the LFS clean filter actually ran: the committed blob is now an LFS pointer, not raw content
		expect(sh("git show HEAD:img.psd")).toContain("version https://git-lfs.github.com/spec/v1");

		const indexChanges = await repo.gvc.getChanges("index");
		expect(indexChanges).toEqual([]);

		const workdirChanges = await repo.gvc.getChanges("workdir");
		expect(workdirChanges.map((c) => c.path.value)).toEqual(["article.md"]);
		expect(await dfp.read(repPath("article.md"))).toBe("# updated, uncommitted");
	});

	test("removing a pattern re-commits the pointer as a plain blob with its real content", async () => {
		await dfp.write(repPath("img.psd"), "psd-content");
		await repo.publish({ commitMessage: "add psd", data: mockUserData, filesToPublish: [path("img.psd")] });
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);
		expect(isLfsPointer("img.psd")).toBe(true);

		// lazy LFS: the working copy holds the pointer text itself, not the real content; re-adding
		// refreshes the index stat so git sees the pointer file as clean — like after a lazy clone
		await dfp.write(repPath("img.psd"), blob("img.psd"));
		await repo.gvc.add([path("img.psd")]);
		pushMock.mockClear();

		await applyWorkspaceLfsMigration(makeWorkspace(["*.docx"]), makeCatalog(), mockUserData);

		// the file left LFS as a real blob — in HEAD and in the working copy — and no divergence remains
		expect(blob("img.psd")).toBe("psd-content");
		expect(await dfp.read(repPath("img.psd"))).toBe("psd-content");
		expect((await repo.gvc.getChanges("workdir")).map((c) => c.path.value)).toEqual([]);
		expect(pushMock).toHaveBeenCalledTimes(1);
		const attrs = await dfp.read(repPath(".gitattributes"));
		expect(attrs).toContain("*.docx filter=lfs");
		expect(attrs).not.toContain("*.psd");
	});

	test("apply aborts before touching anything when the LFS object of a leaving file is unavailable", async () => {
		await dfp.write(repPath("img.psd"), "psd-content");
		await repo.publish({ commitMessage: "add psd", data: mockUserData, filesToPublish: [path("img.psd")] });
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);

		// lazy LFS working copy + the object is gone from the local LFS store (e.g. a fresh lazy clone)
		const pointerText = blob("img.psd");
		await dfp.write(repPath("img.psd"), pointerText);
		await repo.gvc.add([path("img.psd")]);
		sh("rm -rf .git/lfs");
		const attrsBefore = await dfp.read(repPath(".gitattributes"));
		pushMock.mockClear();

		// pull resolves but materializes nothing — the server has no object either
		const pullSpy = jest.spyOn(GitVersionControl.prototype, "pullLfsObjects").mockResolvedValue(undefined);
		await expect(
			applyWorkspaceLfsMigration(makeWorkspace(["*.docx"]), makeCatalog(), mockUserData),
		).rejects.toThrow("img.psd");
		pullSpy.mockRestore();

		// nothing changed: patterns intact, pointer commit intact, workdir clean, nothing pushed
		expect({
			attrs: await dfp.read(repPath(".gitattributes")),
			workdir: await dfp.read(repPath("img.psd")),
			headIsPointer: isLfsPointer("img.psd"),
			workdirChanges: await repo.gvc.getChanges("workdir"),
			indexChanges: await repo.gvc.getChanges("index"),
			pushes: pushMock.mock.calls.length,
		}).toEqual({
			attrs: attrsBefore,
			workdir: pointerText,
			headIsPointer: true,
			workdirChanges: [],
			indexChanges: [],
			pushes: 0,
		});
	});

	test("adding a pattern never triggers an LFS download", async () => {
		await dfp.write(repPath("img.psd"), "psd-content");
		await repo.publish({ commitMessage: "add psd", data: mockUserData, filesToPublish: [path("img.psd")] });

		const pullSpy = jest.spyOn(GitVersionControl.prototype, "pullLfsObjects");
		await applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData);
		expect(pullSpy).not.toHaveBeenCalled();
		pullSpy.mockRestore();

		expect(isLfsPointer("img.psd")).toBe(true);
	});

	test("commit failure rolls back .gitattributes and unstages affected files without touching their content", async () => {
		await dfp.write(repPath("img.psd"), "psd-content");
		await repo.publish({ commitMessage: "add psd", data: mockUserData, filesToPublish: [path("img.psd")] });
		pushMock.mockClear();

		const commitSpy = jest.spyOn(GitVersionControl.prototype, "commit").mockRejectedValueOnce(new Error("boom"));
		await expect(applyWorkspaceLfsMigration(makeWorkspace(["*.psd"]), makeCatalog(), mockUserData)).rejects.toThrow(
			"boom",
		);
		commitSpy.mockRestore();

		expect(await repo.gvc.getChanges("workdir")).toEqual([]);
		expect(await repo.gvc.getChanges("index")).toEqual([]);
		expect(await dfp.read(repPath("img.psd"))).toBe("psd-content");
	});
});
