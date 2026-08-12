import type YamlFileConfig from "@core/utils/YamlFileConfig";
import UiLanguage from "@ext/localization/core/model/Language";
import type { AppSettings } from "../levels/app-settings";
import { YamlSettingsStore } from "./SettingsStore";
import type { StoredSettings } from "./types";

type AppSettingsYaml = { settings?: StoredSettings<typeof AppSettings> };

const createMockYaml = (initial: Record<string, unknown> = {}): YamlFileConfig<AppSettingsYaml> => {
	const data: Record<string, unknown> = JSON.parse(JSON.stringify(initial));
	return {
		get: (key: string) => data[key],
		set: (key: string, value: unknown) => {
			data[key] = value;
		},
		save: jest.fn().mockResolvedValue(undefined),
	} as unknown as YamlFileConfig<AppSettingsYaml>;
};

describe("YamlSettingsStore", () => {
	it("read returns empty object when no settings key", () => {
		const store = new YamlSettingsStore(createMockYaml());
		expect(store.read()).toEqual({});
	});

	it("write persists settings and triggers save", async () => {
		const yaml = createMockYaml();
		const store = new YamlSettingsStore<typeof AppSettings>(yaml);

		await store.write({ general: { language: UiLanguage.ru } });

		expect(yaml.save).toHaveBeenCalled();
		expect(store.read()).toEqual({ general: { language: "ru" } });
	});

	it("setKey creates nested path", async () => {
		const store = new YamlSettingsStore(createMockYaml());

		await store.setKey("services.auth", "https://example.com");

		expect(store.read()).toEqual({ services: { auth: "https://example.com" } });
	});

	it("getKey retrieves nested value", () => {
		const store = new YamlSettingsStore(
			createMockYaml({ settings: { services: { auth: "https://example.com" } } }),
		);

		expect(store.getKey<string>("services.auth")).toEqual("https://example.com");
	});

	it("deleteKey removes value and cleans empty parents", async () => {
		const store = new YamlSettingsStore(createMockYaml({ settings: { services: { auth: "url" } } }));

		await store.deleteKey("services.auth");

		expect(store.read()).toEqual({});
	});
});
