import type { AppConfig } from "@app/config/AppConfig";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import BareRepository from "@ext/git/core/Repository/BareRepository";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import { TEST_GIT_CATALOG_PATH } from "@ext/git/test/testGitCatalogPath";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";

const rootPath = new Path(TEST_GIT_CATALOG_PATH).parentDirectoryPath;
let wm: WorkspaceManager, rp: RepositoryProvider, workspacePath: WorkspacePath;

describe("CatalogEntryAttach", () => {
	beforeAll(async () => {
		rp = new RepositoryProvider();
		wm = new WorkspaceManager(
			(path) => MountFileProvider.fromDefault(new Path(path)),
			(fs) => new FileStructureEventHandlers(fs).mount(),
			rp,
			{} as AppConfig,
			YamlFileConfig.dummy(),
		);

		workspacePath = await wm.addWorkspace(rootPath.value, { name: "Test", icon: "layers" }, true);
		await wm.setWorkspace(workspacePath);
	});

	afterAll(async () => {
		const fp = wm.current().getFileProvider();
		try {
			await fp.delete(new Path("bare"));
			await fp.delete(new Path("workdir"));
		} catch {}
	});

	it("маунтит GitTreeFileProvider, если репозиторий bare", async () => {
		const repoPath = new Path("bare");
		await new GitCommands(wm.current().getFileProvider(), repoPath).init({
			sourceType: SourceType.git,
			userName: "1",
			userEmail: "1",
		});

		const fp = wm.current().getFileProvider();
		const config = await fp.read(repoPath.join(new Path(".git/config")));
		const f = config.replace("bare = false", "bare = true");
		await fp.write(repoPath.join(new Path(".git/config")), f);

		await wm.setWorkspace(workspacePath);
		const entries = wm.current().getAllCatalogs();
		const repo = await rp.getRepositoryByPath(repoPath, wm.current().getFileProvider());

		expect(repo).toBeInstanceOf(BareRepository);

		expect(Array.from(entries.keys()).length).toBe(15);
		expect(wm.current().getFileProvider()).toBeInstanceOf(MountFileProvider);
		expect(Array.from(wm.current().getFileProvider().allFp().keys())).toContainEqual("bare");
		expect(wm.current().getFileProvider().at(new Path("bare"))).toBeInstanceOf(GitTreeFileProvider);
	});

	it("не маунтит GitTreeFileProvider, если репозиторий не bare", async () => {
		const repoPath = new Path("workdir");
		await new GitCommands(wm.current().getFileProvider(), repoPath).init({
			sourceType: SourceType.git,
			userName: "1",
			userEmail: "1",
		});

		await wm.setWorkspace(workspacePath);
		const entries = wm.current().getAllCatalogs();
		const repo = await rp.getRepositoryByPath(repoPath, wm.current().getFileProvider());

		expect(repo).toBeInstanceOf(WorkdirRepository);

		expect(Array.from(entries.keys()).length).toBe(16);
		expect(wm.current().getFileProvider()).toBeInstanceOf(MountFileProvider);
		expect(Array.from(wm.current().getFileProvider().allFp().keys())).not.toContainEqual("workdir");
		expect(wm.current().getFileProvider().at(new Path("workdir"))).toBeInstanceOf(DiskFileProvider);
	});
});
