import { AppSettings } from "../levels/app-settings";
import { getFixedPaths, getOverridablePaths, isClientOverridable, projectByPaths } from "./schemaUtils";

describe("schemaUtils", () => {
	describe("partitioning", () => {
		it("getOverridablePaths returns only marked keys", () => {
			const paths = getOverridablePaths(AppSettings);
			expect(paths).toContain("general.language");
			expect(paths).toContain("general.theme");
			expect(paths).not.toContain("services.git-proxy.endpoint");
			expect(paths).not.toContain("enterprise.endpoint");
		});

		it("getFixedPaths returns all non-marked keys", () => {
			const paths = getFixedPaths(AppSettings);
			expect(paths).not.toContain("general.language");
			expect(paths).not.toContain("general.theme");
			expect(paths).toContain("services.git-proxy.endpoint");
			expect(paths).toContain("enterprise.endpoint");
			expect(paths).toContain("services.ai.enabled");
		});

		it("isClientOverridable identifies keys correctly", () => {
			expect(isClientOverridable(AppSettings, "general.language")).toBe(true);
			expect(isClientOverridable(AppSettings, "general.theme")).toBe(true);
			expect(isClientOverridable(AppSettings, "services.git-proxy.endpoint")).toBe(false);
			expect(isClientOverridable(AppSettings, "unknown.key")).toBe(false);
		});
	});

	describe("projectByPaths", () => {
		it("builds sparse object from paths", () => {
			const values = {
				general: { language: "ru", theme: "dark" },
				services: { "git-proxy": "https://proxy.example.com" },
			};
			const paths = ["general.language", "services.git-proxy"];
			const result = projectByPaths(values, paths);

			expect(result).toEqual({
				general: { language: "ru" },
				services: { "git-proxy": "https://proxy.example.com" },
			});
			expect(result.general.theme).toBeUndefined();
		});

		it("ignores paths not present in values", () => {
			const values = { general: { language: "ru" } };
			const result = projectByPaths(values, ["general.theme", "services.auth"]);
			expect(result).toEqual({});
		});
	});
});
