import { AppSettings } from "../levels/app-settings";
import { cachedSettingsStore, getCachedSetting } from "./cachedSettingsStore";
import { extractDefaults } from "./schemaUtils";

describe("cachedSettingsStore", () => {
	beforeEach(() => {
		cachedSettingsStore.setState({
			values: extractDefaults(AppSettings),
			fixed: {},
		});
	});

	describe("fixed slice", () => {
		it("setFixed replaces the fixed slice", () => {
			cachedSettingsStore.getState().setFixed({
				services: { "git-proxy": { endpoint: "https://fixed.example.com" } },
			});

			expect(cachedSettingsStore.getState().fixed).toEqual({
				services: { "git-proxy": { endpoint: "https://fixed.example.com" } },
			});
		});

		it("getCachedSetting returns fixed value over persisted value", () => {
			cachedSettingsStore.getState().setFixed({
				services: { "git-proxy": { endpoint: "https://fixed.example.com" } },
			});

			const value = getCachedSetting("services.git-proxy.endpoint");
			expect(value).toBe("https://fixed.example.com");
		});

		it("getCachedSetting falls through to persisted value when fixed is empty", () => {
			const value = getCachedSetting("services.git-proxy.endpoint");
			expect(value).toBe("https://gram.ax/git-proxy/");
		});

		it("getCachedSetting falls through to persisted value for keys not in fixed slice", () => {
			cachedSettingsStore.getState().setFixed({
				services: { auth: { endpoint: "https://fixed-auth.example.com" } },
			});

			expect(getCachedSetting("services.auth.endpoint")).toBe("https://fixed-auth.example.com");
			expect(getCachedSetting("services.git-proxy.endpoint")).toBe("https://gram.ax/git-proxy/");
		});
	});
});
