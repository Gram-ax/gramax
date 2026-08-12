import type YamlFileConfig from "@core/utils/YamlFileConfig";
import { migrateWorkspaceConfig } from "./workspaceMigration";

type Data = Record<string, unknown>;

// biome-ignore lint/suspicious/noExplicitAny: mock stands in for any workspace yaml shape
const createMockYaml = (initial: Data = {}): YamlFileConfig<any> => {
	const data: Data = JSON.parse(JSON.stringify(initial));
	return {
		get: (key: string) => data[key],
		set: (key: string, value: unknown) => {
			data[key] = value;
		},
		delete: (key: string) => {
			delete data[key];
		},
		inner: () => data,
		save: jest.fn().mockResolvedValue(undefined),
		// biome-ignore lint/suspicious/noExplicitAny: partial mock cast
	} as unknown as YamlFileConfig<any>;
};

describe("migrateWorkspaceConfig", () => {
	it("migrates legacy fields when settings is an empty object (the 1a bug)", async () => {
		const yaml = createMockYaml({
			webEditorUrl: "https://test.gram.ax",
			services: {
				gitProxy: { url: "https://develop.gram.ax/git-proxy" },
				auth: { url: "https://gram.ax/auth" },
				diagramRenderer: { url: "https://app.gram.ax/diagram-renderer" },
			},
			settings: {},
		});

		await migrateWorkspaceConfig(yaml);

		expect(yaml.get("settings")).toEqual({
			services: {
				"web-editor": { endpoint: "https://test.gram.ax" },
				"git-proxy": { endpoint: "https://develop.gram.ax/git-proxy" },
				auth: { endpoint: "https://gram.ax/auth" },
				"diagram-renderer": { endpoint: "https://app.gram.ax/diagram-renderer" },
			},
		});
		// Non-destructive: the legacy fields stay in place for the enterprise config sync.
		expect(yaml.get("webEditorUrl")).toBe("https://test.gram.ax");
		expect(yaml.get("services")).toEqual({
			gitProxy: { url: "https://develop.gram.ax/git-proxy" },
			auth: { url: "https://gram.ax/auth" },
			diagramRenderer: { url: "https://app.gram.ax/diagram-renderer" },
		});
		expect(yaml.save).toHaveBeenCalled();
	});

	it("does not clobber already-migrated settings (merge, not replace)", async () => {
		const yaml = createMockYaml({
			webEditorUrl: "https://legacy.example",
			services: { gitProxy: { url: "https://legacy-proxy.example" } },
			settings: {
				services: { "git-proxy": { endpoint: "https://kept.example" } },
				general: { theme: "dark" },
			},
		});

		await migrateWorkspaceConfig(yaml);

		// existing new-format value wins; legacy only fills the gap
		expect(yaml.get("settings")).toEqual({
			services: {
				"git-proxy": { endpoint: "https://kept.example" },
				"web-editor": { endpoint: "https://legacy.example" },
			},
			general: { theme: "dark" },
		});
	});

	it("is idempotent: a fully-migrated file does not save again", async () => {
		const yaml = createMockYaml({
			settings: { services: { "web-editor": { endpoint: "https://x.example" } } },
		});

		await migrateWorkspaceConfig(yaml);

		expect(yaml.save).not.toHaveBeenCalled();
		expect(yaml.get("settings")).toEqual({
			services: { "web-editor": { endpoint: "https://x.example" } },
		});
	});

	it("leaves the enterprise object untouched (enterprise stays on the legacy shape)", async () => {
		const yaml = createMockYaml({
			enterprise: {
				gesUrl: "https://ges.example",
				refreshInterval: 60000,
				lastUpdateDate: 5,
				modules: { git: { enabled: true } },
			},
			settings: {},
		});

		await migrateWorkspaceConfig(yaml);

		// Enterprise migration into settings.* is deferred to a separate MR.
		expect(yaml.save).not.toHaveBeenCalled();
		expect(yaml.get("enterprise")).toEqual({
			gesUrl: "https://ges.example",
			refreshInterval: 60000,
			lastUpdateDate: 5,
			modules: { git: { enabled: true } },
		});
		expect(yaml.get("settings")).toEqual({});
	});
});
