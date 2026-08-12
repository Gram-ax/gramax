import type { AppConfig } from "@app/config/AppConfig";
import UiLanguage from "@ext/localization/core/model/Language";
import Theme from "@ext/Theme/Theme";

// Schema defaults follow the ambient locale / OS theme — pin them so the
// suite passes on any machine.
jest.mock("@ext/localization/core/model/Language", () => ({
	...jest.requireActual("@ext/localization/core/model/Language"),
	// biome-ignore lint/style/useNamingConvention: ESM interop flag, dropped by the spread
	__esModule: true,
	resolveDefaultLanguage: () => "en",
}));
jest.mock("@ext/Theme/Theme", () => ({
	...jest.requireActual("@ext/Theme/Theme"),
	// biome-ignore lint/style/useNamingConvention: ESM interop flag, dropped by the spread
	__esModule: true,
	resolveDefaultTheme: () => "light",
}));

import type { AppSettings } from "../levels/app-settings";
import SettingsResolver from "./SettingsResolver";
import type { SettingsStore } from "./SettingsStore";
import { deleteByPath, getByPath, setByPath } from "./schemaUtils";
import { Level } from "./settings";
import type { StoredSettings } from "./types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

type AppSettingsSchema = typeof AppSettings;
type MemorySettings = StoredSettings<AppSettingsSchema>;

const createMemoryStore = (initial: MemorySettings = {}): SettingsStore<AppSettingsSchema> => {
	let data = clone(initial);

	return {
		read: () => data,
		write: async (s) => {
			data = clone(s);
		},
		getKey: <V>(key: string): V | undefined => getByPath<V>(data as Record<string, unknown>, key),
		setKey: async (key, value) => setByPath(data as Record<string, unknown>, key, value),
		deleteKey: async (key) => deleteByPath(data as Record<string, unknown>, key),
	};
};

// Minimal YamlFileConfig stand-in — the resolver only reads the "settings" key.
const workspaceWith = (settings: MemorySettings) =>
	({ yaml: () => ({ get: (key: string) => (key === "settings" ? settings : undefined) }) }) as never;

const emptyAppConfig = {
	services: { gitProxy: {}, auth: {}, diagramRenderer: {} },
	enterprise: {},
} as unknown as AppConfig;

const appConfigWithEnv = {
	services: {
		gitProxy: { url: "https://env-proxy.example.com" },
		auth: {},
		diagramRenderer: {},
	},
	enterprise: { gesUrl: "https://env-ges.example.com" },
} as unknown as AppConfig;

describe("SettingsResolver", () => {
	describe("resolveApp", () => {
		it("returns schema defaults when stores are empty", () => {
			const resolver = new SettingsResolver(emptyAppConfig, createMemoryStore());
			const result = resolver.resolveApp();

			expect(result.general.language).toEqual("en");
			expect(result.general.theme).toEqual("light");
			expect(result.services["git-proxy"]?.endpoint).toEqual("https://gram.ax/git-proxy/");
		});

		it("env overrides take precedence over defaults", () => {
			const resolver = new SettingsResolver(appConfigWithEnv, createMemoryStore());
			const result = resolver.resolveApp();

			expect(result.services["git-proxy"]?.endpoint).toEqual("https://env-proxy.example.com");
			expect(result.enterprise.endpoint).toEqual("https://env-ges.example.com");
		});

		it("stored values take precedence over env", () => {
			const appStore = createMemoryStore({
				services: { "git-proxy": { endpoint: "https://stored-proxy.example.com" } },
			});
			const resolver = new SettingsResolver(appConfigWithEnv, appStore);
			const result = resolver.resolveApp();

			expect(result.services["git-proxy"]?.endpoint).toEqual("https://stored-proxy.example.com");
		});
	});

	describe("resolveWorkspace", () => {
		it("workspace overrides app-level settings", () => {
			const wsStore = createMemoryStore({ services: { auth: { endpoint: "https://ws-auth.example.com" } } });
			const resolver = new SettingsResolver(emptyAppConfig, createMemoryStore());
			const result = resolver.resolveWorkspace(wsStore);

			expect(result.services.auth?.endpoint).toEqual("https://ws-auth.example.com");
			expect(result.general.language).toEqual("en");
		});
	});

	describe("resolveServices", () => {
		it("falls back to app-level services when there is no workspace", () => {
			const appStore = createMemoryStore({
				services: { auth: { endpoint: "https://app-auth.example.com" } },
			});
			const resolver = new SettingsResolver(appConfigWithEnv, appStore);
			const services = resolver.resolveServices();

			expect(services?.auth?.endpoint).toEqual("https://app-auth.example.com");
			expect(services?.["git-proxy"]?.endpoint).toEqual("https://env-proxy.example.com");
		});

		it("applies the app → workspace hierarchy", () => {
			const appStore = createMemoryStore({
				services: { auth: { endpoint: "https://app-auth.example.com" } },
			});
			const resolver = new SettingsResolver(appConfigWithEnv, appStore);
			const services = resolver.resolveServices(
				workspaceWith({ services: { auth: { endpoint: "https://ws-auth.example.com" } } }),
			);

			// Workspace override wins; untouched services fall through from the app layer.
			expect(services?.auth?.endpoint).toEqual("https://ws-auth.example.com");
			expect(services?.["git-proxy"]?.endpoint).toEqual("https://env-proxy.example.com");
		});
	});

	describe("set", () => {
		it("writes value to store", async () => {
			const appStore = createMemoryStore();
			const resolver = new SettingsResolver(emptyAppConfig, appStore);

			await resolver.set(appStore, Level.app, "general.language", "ru");

			expect(appStore.read()).toMatchObject({ general: { language: "ru" } });
		});

		it("rejects writes at a level not in the availableAt mask", async () => {
			const appStore = createMemoryStore();
			const resolver = new SettingsResolver(emptyAppConfig, appStore);

			// `enterprise.endpoint` is app-or-workspace (availableAt: APP_OR_WORKSPACE), not catalog
			await expect(resolver.set(appStore, Level.catalog, "enterprise.endpoint", "x")).rejects.toThrow(
				/cannot be written at level/,
			);
		});
	});

	describe("setBatch", () => {
		it("applies multiple keys atomically", async () => {
			const appStore = createMemoryStore();
			const resolver = new SettingsResolver(emptyAppConfig, appStore);

			await resolver.setBatch(appStore, Level.app, {
				"general.language": "ru",
				"general.theme": Theme.dark,
			});

			expect(appStore.read()).toMatchObject({ general: { language: "ru", theme: "dark" } });
		});

		it("rejects on unknown key without writing valid keys", async () => {
			const appStore = createMemoryStore();
			const resolver = new SettingsResolver(emptyAppConfig, appStore);

			await expect(
				resolver.setBatch(appStore, Level.app, {
					"general.language": "ru",
					"nonexistent.key": "value",
				}),
			).rejects.toThrow(/Unknown setting/);

			// validation-first: no write happened
			expect(appStore.read()).toEqual({});
		});
	});

	describe("reset", () => {
		it("removes key from store", async () => {
			const appStore = createMemoryStore({ general: { language: UiLanguage.ru } });
			const resolver = new SettingsResolver(emptyAppConfig, appStore);

			await resolver.reset(appStore, "general.language");

			expect(appStore.read()).toEqual({});
		});
	});
});
