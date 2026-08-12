import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { YamlSettingsStore } from "@ext/settings/logic/SettingsStore";
import { Level, type LevelName } from "@ext/settings/logic/settings";
import { Command } from "../../types/Command";

// This command only ever resets app/workspace level — catalog settings go
// through CatalogPropsEditorBody's own form, not this pipeline.
type SettingsLevel = Extract<LevelName, "app" | "workspace">;

const resetSetting: Command<{ ctx: Context; keys: string[]; level: SettingsLevel }, void> = Command.create({
	path: "settings/reset",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ keys, level }) {
		if (level !== "app" && level !== "workspace") {
			throw new DefaultError(`Invalid settings level: ${level ?? "<missing>"}`);
		}

		const store =
			level === "workspace" ? new YamlSettingsStore(this._app.wm.current().yaml()) : this._app.settings.appStore;
		await this._app.settings.resetBatch(store, level === "workspace" ? Level.workspace : Level.app, keys);
	},

	params(ctx, q, body) {
		const keys = (body as { keys?: unknown })?.keys;
		if (!Array.isArray(keys) || keys.some((k) => typeof k !== "string")) {
			throw new DefaultError("keys must be an array of strings");
		}
		return { ctx, keys: keys as string[], level: q.level as SettingsLevel };
	},
});

export default resetSetting;
