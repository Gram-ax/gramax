import type YamlFileConfig from "@core/utils/YamlFileConfig";
import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { mapLegacyServices } from "./legacyServices";

type WorkspaceConfigWithSettings = WorkspaceConfig & {
	settings?: Record<string, unknown>;
};

/**
 * Eager migration: folds legacy workspace-level service overrides into
 * `settings.services` so the settings resolver and UI can read them.
 *
 * Merge-not-clobber and NON-destructive: the legacy `services` / `webEditorUrl`
 * fields are kept in place. The enterprise config sync still reads and writes the
 * legacy shape (and hashes it for change detection), so dropping the legacy fields
 * here would break it. Migrating enterprise settings into `settings.*` is deferred
 * to a separate MR.
 *
 * Mapped (only when the target key is still unset):
 *   services.gitProxy.url        → settings.services.git-proxy.endpoint
 *   services.auth.url            → settings.services.auth.endpoint
 *   services.diagramRenderer.url → settings.services.diagram-renderer.endpoint
 *   webEditorUrl                 → settings.services.web-editor.endpoint
 */
export const migrateWorkspaceConfig = async (yaml: YamlFileConfig<WorkspaceConfigWithSettings>): Promise<void> => {
	const raw = yaml.inner();
	const existing = (yaml.get("settings") ?? {}) as Record<string, unknown>;
	const settings: Record<string, unknown> = { ...existing };

	const servicesSettings = {
		...((settings.services ?? {}) as Record<string, unknown>),
	};
	let servicesTouched = false;
	// Never clobber an already-migrated `settings.services.<key>`.
	for (const [key, endpoint] of Object.entries(mapLegacyServices(raw))) {
		if (servicesSettings[key] === undefined) {
			servicesSettings[key] = { endpoint };
			servicesTouched = true;
		}
	}

	if (!servicesTouched) return;

	settings.services = servicesSettings;
	yaml.set("settings", settings as WorkspaceConfigWithSettings["settings"]);

	await yaml.save();
};
