import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { AppSettings } from "@ext/settings/levels/app-settings";
import { YamlSettingsStore } from "@ext/settings/logic/SettingsStore";
import { isClientOverridable } from "@ext/settings/logic/schemaUtils";
import { Level, type LevelName } from "@ext/settings/logic/settings";
import { AI_ENDPOINT_KEY, AI_TOKEN_KEY, splitAiKeys } from "@ext/settings/logic/splitAiKeys";
import { Command } from "../../types/Command";

// This command only ever writes app/workspace level — catalog settings go
// through CatalogPropsEditorBody's own form, not this pipeline.
type SettingsLevel = Extract<LevelName, "app" | "workspace">;

const updateSetting: Command<{ ctx: Context; settings: Record<string, unknown>; level: SettingsLevel }, void> =
	Command.create({
		path: "settings/update",

		kind: ResponseKind.none,

		// TODO(app-settings): for level=workspace gate behind a dedicated
		// `ConfigureWorkspace` permission once it lands (see epic spec).
		// AuthorizeMiddleware below ensures only authenticated users can
		// hit the endpoint in non-browser/non-tauri environments.
		middlewares: [new AuthorizeMiddleware()],

		async do({ ctx, settings, level }) {
			if (this._app.conf.isReadOnly) {
				const rejected: string[] = [];
				for (const key of Object.keys(settings)) {
					if (!isClientOverridable(AppSettings, key)) rejected.push(key);
				}
				if (rejected.length > 0) {
					throw new DefaultError(`Settings keys not client-writable: ${rejected.join(", ")}`);
				}
			}

			if (level === "workspace") {
				const workspace = this._app.wm.current();
				const { aiPatch, yamlPatch } = splitAiKeys(settings);

				if (aiPatch) {
					// AI credentials live in a per-user cookie via AiDataProvider, not the
					// workspace YAML — preserve fields that aren't in the patch.
					const current = this._app.adp.getEditorAiData(ctx, workspace.path());
					this._app.adp.setEditorAiData(ctx, workspace.path(), {
						apiUrl: aiPatch[AI_ENDPOINT_KEY] ?? current.apiUrl ?? "",
						token: aiPatch[AI_TOKEN_KEY] ?? current.token ?? "",
						instanceName: current.instanceName,
					});
				}

				if (Object.keys(yamlPatch).length === 0) return;
				const store = new YamlSettingsStore(workspace.yaml());
				await this._app.settings.setBatch(store, Level.workspace, yamlPatch);
				return;
			}

			await this._app.settings.setBatch(this._app.settings.appStore, Level.app, settings);
		},

		params(ctx, q, body) {
			if (q.level !== "app" && q.level !== "workspace") {
				throw new DefaultError(`Invalid settings level: ${q.level ?? "<missing>"}`);
			}
			return { ctx, settings: body as Record<string, unknown>, level: q.level };
		},
	});

export default updateSetting;
