import type { AppConfig } from "@app/config/AppConfig";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import RepositoryProviderEventHandlers from "@ext/git/core/Repository/events/RepositoryProviderEventHandlers";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { TEST_GIT_CATALOG_PATH } from "@ext/git/test/testGitCatalogPath";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { execSync } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const workspaceRoot = new Path(TEST_GIT_CATALOG_PATH).parentDirectoryPath;
const sourceName = "versionsSource";
const bareName = "versionsBare";
const sourcePath = join(workspaceRoot.value, sourceName);
const barePath = join(workspaceRoot.value, bareName);

const git = (cwd: string, cmd: string) => execSync(`git ${cmd}`, { cwd, stdio: "pipe" }).toString().trim();

/**
 * Mirrors what a docportal instance holds: a bare clone whose only local branch is the default one,
 * every other branch living in refs/remotes/origin/*. libgit2's bare clone leaves the repo in exactly
 * this shape, and a branch only becomes local once the portal has been switched to it.
 */
const prepare = () => {
	rmSync(sourcePath, { recursive: true, force: true });
	rmSync(barePath, { recursive: true, force: true });

	mkdirSync(sourcePath, { recursive: true });
	git(sourcePath, "init -b master");
	git(sourcePath, "config user.email test@test.com");
	git(sourcePath, "config user.name test");
	writeFileSync(join(sourcePath, ".doc-root.yaml"), "title: Versions\nversions:\n  - 'releases/*'\n");
	writeFileSync(join(sourcePath, "article.md"), "---\ntitle: article\n---\n\n![](./img.png)\n");
	writeFileSync(join(sourcePath, "img.png"), "master-image");
	git(sourcePath, "add -A");
	git(sourcePath, 'commit -m "master"');

	git(sourcePath, "checkout -b releases/v1.0");
	writeFileSync(join(sourcePath, "img.png"), "v1-image");
	git(sourcePath, "add -A");
	git(sourcePath, 'commit -m "v1"');

	git(sourcePath, "checkout -b releases/v2.0 master");
	writeFileSync(join(sourcePath, "img.png"), "v2-image");
	git(sourcePath, "add -A");
	git(sourcePath, 'commit -m "v2"');
	git(sourcePath, "checkout master");

	// a clone leaves every non-default branch in refs/remotes/origin/* — the shape a portal starts with
	git(workspaceRoot.value, `clone --no-checkout ${sourcePath} ${bareName}`);
	git(barePath, "config core.bare true");
	// releases/v1.0 has been switched to once, releases/v2.0 never has
	git(barePath, "branch releases/v1.0 origin/releases/v1.0");
};

let wm: WorkspaceManager, rp: RepositoryProvider, workspacePath: WorkspacePath;

describe("версии в bare-репозитории", () => {
	beforeAll(async () => {
		prepare();

		rp = new RepositoryProvider();
		wm = new WorkspaceManager(
			(path) => MountFileProvider.fromDefault(new Path(path)),
			(fs) => {
				new FileStructureEventHandlers(fs).mount();
				new RepositoryProviderEventHandlers(fs, rp).mount();
			},
			() => undefined as never,
			rp,
			{} as AppConfig,
			YamlFileConfig.dummy(),
		);

		workspacePath = await wm.addWorkspace(workspaceRoot.value, { name: "Test", icon: "layers" }, true);
		await wm.setWorkspace(workspacePath);
	});

	afterAll(() => {
		if (existsSync(sourcePath)) rmSync(sourcePath, { recursive: true, force: true });
		if (existsSync(barePath)) rmSync(barePath, { recursive: true, force: true });
	});

	test("в список версий попадают и ветки, на которые ни разу не переключались", async () => {
		const catalog = await wm.current().getContextlessCatalog(bareName);
		const names = catalog.props.resolvedVersions?.map((v) => v.name).sort();
		expect(names).toEqual(["releases/v1.0", "releases/v2.0"]);
	});

	test("каталог версии резолвится в версионированный каталог", async () => {
		const catalog = await wm.current().getContextlessCatalog(`${bareName}:releases%2Fv1.0`);
		expect(catalog.basePath.value).toBe(`${bareName}:releases%2Fv1.0`);
	});

	test("каталог версии резолвится после обновления каталога", async () => {
		await wm.current().refreshCatalog(bareName);
		const catalog = await wm.current().getContextlessCatalog(`${bareName}:releases%2Fv1.0`);
		expect(catalog.basePath.value).toBe(`${bareName}:releases%2Fv1.0`);
	});

	test("ресурс статьи читается из дерева версии", async () => {
		const catalog = await wm.current().getContextlessCatalog(`${bareName}:releases%2Fv1.0`);
		const fp = wm.current().getFileProvider();
		const content = await fp.readAsBinary(catalog.basePath.join(new Path("img.png")));
		expect(content?.toString()).toBe("v1-image");
	});
});
