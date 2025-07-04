import type { AppConfig } from "@app/config/AppConfig";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import { TEST_GIT_CATALOG_PATH } from "@ext/git/test/testGitCatalogPath";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";

const rootPath = new Path(TEST_GIT_CATALOG_PATH).parentDirectoryPath;
let wm: WorkspaceManager, rp: RepositoryProvider, workspacePath: WorkspacePath;

describe("CatalogVersionResolver", () => {
	beforeAll(async () => {
		rp = new RepositoryProvider();
		wm = new WorkspaceManager(
			(path) => MountFileProvider.fromDefault(new Path(path)),
			(fs) => new FileStructureEventHandlers(fs).mount(),
			() => {},
			rp,
			{} as AppConfig,
			YamlFileConfig.dummy(),
		);

		workspacePath = await wm.addWorkspace(rootPath.value, { name: "Test", icon: "layers" }, true);
		await wm.setWorkspace(workspacePath);
	});

	test("читает gitCatalog как WorkdirRepository и распознаёт его версии", async () => {
		const catalog = await wm.current().getContextlessCatalog("gitCatalog");
		expect(catalog.repo).toBeInstanceOf(WorkdirRepository);
		expect(wm.current().getFileProvider().at(catalog.basePath)).toBeInstanceOf(DiskFileProvider);
		expect(catalog.props.versions).toEqual(["tags/*"]);
		expect(catalog.props.resolvedVersions).toBeDefined();
		expect(catalog.props.resolvedVersions?.length).toBe(1);
	});

	test("читает версии каталога gitCatalog:tag1", async () => {
		const catalog = await wm.current().getContextlessCatalog("gitCatalog:tag1");
		expect(catalog.repo).toBeInstanceOf(WorkdirRepository);
		expect(wm.current().getFileProvider().at(catalog.basePath)).toBeInstanceOf(GitTreeFileProvider);
		expect(catalog.props.versions).toEqual(["tags/*"]);
		expect(catalog.props.resolvedVersions?.length).toBe(1);
	});

	describe("версионированный каталог имеет тот же инстанс Repository, что и основной каталог", () => {
		test("изначально", async () => {
			const catalog = await wm.current().getContextlessCatalog("gitCatalog");
			const catalogVer = await wm.current().getContextlessCatalog("gitCatalog:tag1");
			expect(catalog.repo).toBeInstanceOf(WorkdirRepository);
			expect(catalogVer.repo).toBeInstanceOf(WorkdirRepository);
			expect(catalog.repo).toBe(catalogVer.repo);
		});

		test("после обновления", async () => {
			const catalog = await wm.current().getContextlessCatalog("gitCatalog");
			await catalog.update();

			const catalogVer = await wm.current().getContextlessCatalog("gitCatalog:tag1");
			expect(catalog.repo).toBeInstanceOf(WorkdirRepository);
			expect(catalogVer.repo).toBeInstanceOf(WorkdirRepository);
			expect(catalog.repo).toBe(catalogVer.repo);
		});
	});

	test("каталог не забывает свои версии после обновления", async () => {
		const catalog = await wm.current().getContextlessCatalog("gitCatalog");
		expect(catalog.props.resolvedVersions?.[0]?.name).toBe("tag1");
		await catalog.update();

		expect(catalog.props.resolvedVersions?.[0]?.name).toBe("tag1");

		const otherCatalog = await wm.current().getContextlessCatalog("gitCatalog");
		expect(otherCatalog.props.resolvedVersions?.[0]?.name).toBe("tag1");
	});
});
