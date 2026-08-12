import type { AppConfig } from "@app/config/AppConfig";
import mergeObjects from "@core/utils/mergeObjects";
import type YamlFileConfig from "@core/utils/YamlFileConfig";
import { Level as TraceLevel, trace } from "@ext/loggers/opentelemetry";
import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { AppSettings } from "../levels/app-settings";
import type { CatalogSettings } from "../levels/catalog-settings";
import { WorkspaceSettings } from "../levels/workspace-settings";
import { type SettingsStore, YamlSettingsStore } from "./SettingsStore";
import { deleteByPath, extractDefaults, filterByTarget, getSchemaEntry, setByPath } from "./schemaUtils";
import { Level, Target } from "./settings";
import type { SettingsKey, StoredSettings } from "./types";

type AppSettingsSchema = typeof AppSettings;
type WorkspaceSettingsSchema = typeof WorkspaceSettings;
type CatalogSettingsSchema = typeof CatalogSettings;
type AllSchemas = AppSettingsSchema & WorkspaceSettingsSchema & CatalogSettingsSchema;
type AnySettingsKey = SettingsKey<AllSchemas>;

const combinedSchema = mergeObjects(AppSettings, WorkspaceSettings) as AppSettingsSchema & WorkspaceSettingsSchema;

type ResolveOptions = { includeDefaults?: boolean };

/** Structural stand-in for Workspace — enough to read its settings without importing the class. */
type WorkspaceLike = { yaml(): YamlFileConfig<WorkspaceConfig> };

export default class SettingsResolver {
	private _envOverrides: StoredSettings<AppSettingsSchema>;
	private _writeQueues = new WeakMap<SettingsStore, Promise<unknown>>();

	constructor(
		appConfig: AppConfig,
		public readonly appStore: SettingsStore<AppSettingsSchema>,
	) {
		this._envOverrides = envToSettings(appConfig);
	}

	/**
	 * Resolve app-level effective settings.
	 * Chain: schema defaults → env overrides → config.yaml stored values.
	 *
	 * Return type is recursively partial: filterByTarget drops keys not exposed
	 * to any runtime target, so any leaf may be absent.
	 *
	 * includeDefaults: false drops the schema-defaults layer — used for the
	 * client hydration payload, where the client computes its own defaults
	 * (browser locale, prefers-color-scheme) that the server realm cannot.
	 */
	resolveApp(opts?: ResolveOptions): StoredSettings<AppSettingsSchema> {
		return filterByTarget(AppSettings, this._appLayer(opts?.includeDefaults ?? true), Target.all);
	}

	/**
	 * Resolve workspace-level effective settings.
	 * Chain: workspace-schema defaults → app defaults+env+stored → workspace stored.
	 * availableAt restricts writes, not reads — anything in the workspace store wins.
	 */
	resolveWorkspace(
		workspaceStore: SettingsStore,
		opts?: ResolveOptions,
	): StoredSettings<AppSettingsSchema & WorkspaceSettingsSchema> {
		const includeDefaults = opts?.includeDefaults ?? true;
		const base = includeDefaults
			? mergeObjects(extractDefaults(WorkspaceSettings), this._appLayer())
			: this._appLayer(false);
		const merged = mergeObjects(base, workspaceStore.read());

		return filterByTarget(
			combinedSchema,
			merged as StoredSettings<AppSettingsSchema & WorkspaceSettingsSchema>,
			Target.all,
		);
	}

	/**
	 * Effective service endpoints for the given workspace, or app-level ones
	 * when there is no workspace. Full hierarchy applies: env overrides →
	 * app config.yaml → workspace settings. Schema defaults are skipped —
	 * service entries have none.
	 */
	resolveServices(
		workspace?: WorkspaceLike | null,
	): StoredSettings<AppSettingsSchema & WorkspaceSettingsSchema>["services"] {
		const effective = workspace
			? this.resolveWorkspace(new YamlSettingsStore(workspace.yaml()), { includeDefaults: false })
			: this.resolveApp({ includeDefaults: false });
		return effective.services;
	}

	@trace({ level: TraceLevel.Important, omitArgs: true })
	// biome-ignore lint/suspicious/noExplicitAny: runtime API accepts parsed JSON values
	async set(store: SettingsStore, level: Level, key: AnySettingsKey | string, value: any): Promise<void> {
		await this.setBatch(store, level, { [key]: value });
	}

	/**
	 * Per-store promise chain serializes concurrent callers in the same Node
	 * process, so each setBatch sees the previous writer's mutation.
	 * Cross-process / cross-tab writes are NOT protected.
	 */
	@trace({ level: TraceLevel.Important, omitArgs: true })
	async setBatch(store: SettingsStore, level: Level, settings: Record<string, unknown>): Promise<void> {
		for (const [key, value] of Object.entries(settings)) {
			this._validate(key, level);
			this._validateValue(key, value);
		}
		const prev = this._writeQueues.get(store) ?? Promise.resolve();
		const next = prev
			.catch(() => undefined)
			.then(async () => {
				const current = store.read() as Record<string, unknown>;
				for (const [key, value] of Object.entries(settings)) {
					if (value === null || value === "") {
						deleteByPath(current, key);
					} else {
						setByPath(current, key, value);
					}
				}
				await store.write(current as StoredSettings<AppSettingsSchema>);
			});
		this._writeQueues.set(store, next);
		await next;
	}

	/** Removes the key so it falls through to the level below. */
	@trace({ level: TraceLevel.Important })
	async reset(store: SettingsStore, key: AnySettingsKey): Promise<void> {
		await store.deleteKey(key);
	}

	/**
	 * Reset multiple keys in one read/write cycle, serialized through the same
	 * per-store write queue as setBatch so concurrent writers don't clobber.
	 */
	@trace({ level: TraceLevel.Important })
	async resetBatch(store: SettingsStore, level: Level, keys: string[]): Promise<void> {
		for (const key of keys) this._validate(key, level);
		const prev = this._writeQueues.get(store) ?? Promise.resolve();
		const next = prev
			.catch(() => undefined)
			.then(async () => {
				const current = store.read() as Record<string, unknown>;
				for (const key of keys) deleteByPath(current, key);
				await store.write(current as StoredSettings<AppSettingsSchema>);
			});
		this._writeQueues.set(store, next);
		await next;
	}

	private _appLayer(includeDefaults = true): StoredSettings<AppSettingsSchema> {
		const overrides = mergeObjects<StoredSettings<AppSettingsSchema>>(this._envOverrides, this.appStore.read());
		return includeDefaults ? mergeObjects(extractDefaults(AppSettings), overrides) : overrides;
	}

	private _validate(key: string, level: Level): void {
		const entry = getSchemaEntry(AppSettings, key) ?? getSchemaEntry(WorkspaceSettings, key);
		if (!entry) throw new Error(`Unknown setting: ${key}`);
		if ((entry.availableAt & level) === 0) {
			throw new Error(`Setting ${key} cannot be written at level ${Level[level]}`);
		}
	}

	private _validateValue(key: string, value: unknown): void {
		const entry = getSchemaEntry(AppSettings, key) ?? getSchemaEntry(WorkspaceSettings, key);
		if (!entry) return;
		if (value === null || value === undefined) return;
		// Entries without a concrete default (endpoint, token, ...) skip the
		// typeof gate. Tighten with a runtime schema (zod) if stricter checks
		// are needed later.
		const expected = entry.default !== null && entry.default !== undefined ? typeof entry.default : null;
		if (expected && typeof value !== expected) {
			throw new Error(`Setting ${key} expects ${expected}, got ${typeof value}`);
		}
	}
}

/**
 * Map AppConfig (env vars) into the settings shape.
 * These act as the env-override layer between defaults and config.yaml.
 */
function envToSettings(config: AppConfig): StoredSettings<AppSettingsSchema> {
	const result: StoredSettings<AppSettingsSchema> = {};

	const services: StoredSettings<AppSettingsSchema>["services"] = {};
	if (config.services?.gitProxy?.url) services["git-proxy"] = { endpoint: config.services.gitProxy.url };
	if (config.services?.auth?.url) services.auth = { endpoint: config.services.auth.url };
	if (config.services?.diagramRenderer?.url)
		services["diagram-renderer"] = { endpoint: config.services.diagramRenderer.url };

	if (config.portalAi?.enabled) {
		services.ai = {
			enabled: config.portalAi.enabled,
			endpoint: config.portalAi.apiUrl,
			token: config.portalAi.token,
		};
	}

	if (Object.keys(services).length > 0) result.services = services;

	const enterprise: StoredSettings<AppSettingsSchema>["enterprise"] = {};
	if (config.enterprise?.gesUrl) enterprise.endpoint = config.enterprise.gesUrl;
	if (config.enterprise?.refreshInterval) {
		enterprise["refresh-interval"] = Math.round(config.enterprise.refreshInterval / 1000);
	}

	if (Object.keys(enterprise).length > 0) result.enterprise = enterprise;

	return result;
}
