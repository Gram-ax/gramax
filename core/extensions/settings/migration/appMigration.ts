import type { AppGlobalConfig } from "@app/config/AppConfig";
import type YamlFileConfig from "@core/utils/YamlFileConfig";

const SETTINGS_VERSION = 1;

/**
 * Eager migration: bumps the yaml schema to SETTINGS_VERSION.
 *
 * v1: read legacy top-level fields and fold them into `settings`:
 *   gesUrl          → settings.enterprise.endpoint
 *   refreshInterval → settings.enterprise.refresh-interval (÷1000, ms→s)
 * Then remove the old fields.
 *
 * Future migrations chain by checking `currentVersion < N` and bumping
 * top-level `version` at the end of each step.
 */
export const migrateAppConfig = async (yaml: YamlFileConfig<AppGlobalConfig>): Promise<void> => {
	await tryMigrateToV1(yaml);
	await yaml.saveIfDirty();
};

const tryMigrateToV1 = async (yaml: YamlFileConfig<AppGlobalConfig>): Promise<void> => {
	const currentVersion = yaml.get("version") ?? 0;
	if (currentVersion >= SETTINGS_VERSION) return;

	const existing = yaml.get("settings") ?? {};
	const gesUrl = yaml.get("gesUrl");
	const refreshInterval = yaml.get("refreshInterval");

	if (gesUrl || refreshInterval) {
		const enterpriseSettings = { ...(existing.enterprise ?? {}) };
		if (gesUrl && enterpriseSettings.endpoint === undefined) enterpriseSettings.endpoint = gesUrl;
		if (refreshInterval && enterpriseSettings["refresh-interval"] === undefined) {
			enterpriseSettings["refresh-interval"] = Math.round(refreshInterval / 1000);
		}
		yaml.set("settings", { ...existing, enterprise: enterpriseSettings });
		yaml.delete("gesUrl");
		yaml.delete("refreshInterval");
	}

	yaml.set("version", SETTINGS_VERSION);
};
