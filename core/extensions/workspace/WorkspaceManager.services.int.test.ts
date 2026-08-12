import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AppConfig } from "@app/config/AppConfig";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructureEventHandlers from "@core/FileStructue/events/FileStuctureEventHandlers";
import YamlFileConfig from "@core/utils/YamlFileConfig";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";

const makeWm = () =>
	new WorkspaceManager(
		(path) => MountFileProvider.fromDefault(new Path(path)),
		(fs) => new FileStructureEventHandlers(fs).mount(),
		() => [] as never,
		new RepositoryProvider(),
		{} as AppConfig,
		YamlFileConfig.dummy(),
	);

let root: string;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "gx-ws-services-"));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

describe("WorkspaceManager.addWorkspace with init config", () => {
	const init = {
		name: "Test",
		icon: "layers",
		webEditorUrl: "https://web-editor.example",
		services: {
			gitProxy: { url: "https://git-proxy.example" },
			auth: { url: "https://auth.example" },
			diagramRenderer: { url: "https://diagrams.example" },
		},
		enterprise: { gesUrl: "https://ges.example", refreshInterval: 600000 },
	};

	test("folds init services into settings.services and keeps legacy fields", async () => {
		const wm = makeWm();
		const path = await wm.addWorkspace(root, init, true);
		const config = wm.getWorkspaceConfig(path).config.inner();

		expect(config.settings?.services).toEqual({
			"git-proxy": { endpoint: "https://git-proxy.example" },
			auth: { endpoint: "https://auth.example" },
			"diagram-renderer": { endpoint: "https://diagrams.example" },
			"web-editor": { endpoint: "https://web-editor.example" },
		});

		// Legacy shape stays: enterprise config sync still reads/writes it.
		expect(config.services).toEqual(init.services);
		expect(config.webEditorUrl).toBe(init.webEditorUrl);
		expect(config.enterprise?.gesUrl).toBe(init.enterprise.gesUrl);
		expect(config.enterprise?.refreshInterval).toBe(init.enterprise.refreshInterval);
	});

	test("persists folded settings to workspace.yaml on disk", async () => {
		await makeWm().addWorkspace(root, init, true);

		const rereadWm = makeWm();
		const path = await rereadWm.addWorkspace(root);
		const config = rereadWm.getWorkspaceConfig(path).config.inner();

		expect(config.settings?.services?.["git-proxy"]).toEqual({ endpoint: "https://git-proxy.example" });
		expect(config.enterprise?.gesUrl).toBe(init.enterprise.gesUrl);
	});
});
