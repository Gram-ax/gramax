import type { AppConfig } from "@app/config/AppConfig";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import ResourceManager from "@core/Resource/ResourceManager";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { TEST_GIT_CATALOG_PATH } from "@ext/git/test/testGitCatalogPath";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";

const rootPath = new Path(TEST_GIT_CATALOG_PATH).parentDirectoryPath;
let wm: WorkspaceManager, rp: RepositoryProvider, workspacePath: WorkspacePath;

const readResource = async (catalogName: string, resource: string) => {
	const catalog = await wm.current().getContextlessCatalog(catalogName);
	const fp = wm.current().getFileProvider();
	const resourceManager = new ResourceManager(fp, Path.empty, catalog.basePath);
	return await resourceManager.getContent(new Path(resource));
};

describe("ресурсы статьи", () => {
	beforeAll(async () => {
		rp = new RepositoryProvider();
		wm = new WorkspaceManager(
			(path) => MountFileProvider.fromDefault(new Path(path)),
			(fs) => new FileStructureEventHandlers(fs).mount(),
			() => undefined as never,
			rp,
			{} as AppConfig,
			YamlFileConfig.dummy(),
		);

		workspacePath = await wm.addWorkspace(rootPath.value, { name: "Test", icon: "layers" }, true);
		await wm.setWorkspace(workspacePath);
	});

	test("читаются в актуальной версии каталога", async () => {
		const content = await readResource("gitCatalog", "./imgs/1.png");
		expect(content?.length).toBeGreaterThan(0);
	});

	test("читаются в версионированном каталоге", async () => {
		const content = await readResource("gitCatalog:tag1", "./imgs/1.png");
		expect(content?.length).toBeGreaterThan(0);
	});
});
