import { getExecutingEnvironment } from "@app/resolveModule/env";
import { getCachedSetting } from "@ext/settings/logic/cachedSettingsStore";
import { setLogLevel } from "./index";
import { Level, levelRank } from "./span";

/**
 * Whether logging is enabled — app setting `logging.level` is anything but "off".
 * Reads the cached settings snapshot, so it is synchronous and boot-safe;
 * the schema default replicates the old feature-flag default (on for `develop`, off under Jest).
 */
export const isLoggingEnabled = (): boolean => getStoredLogLevel() !== Level.Off;

/**
 * Activate/deactivate the OTel SDK at runtime without a restart. Persistence is the caller's
 * concern (the settings form saves `logging.level`, where "off" means disabled). Disabling is a
 * soft-off (`traced()` gates on `otel.registered`); enabling reuses an already-wired SDK or
 * registers it from scratch.
 */
export const applyLoggingEnabled = async (enabled: boolean): Promise<void> => {
	if (!enabled) {
		if (globalThis.otel) globalThis.otel.registered = false;
		return;
	}

	if (globalThis.otel?.tracerApi) {
		globalThis.otel.registered = true;
		return;
	}

	// Import by alias, not "./registerOtel": builds swap this specifier for the per-env
	// implementation (see scripts/compileTimeEnv.mjs `dynamicModules`), and a relative path
	// bypasses the swap — pulling the Node-only `next` variant into browser bundles.
	await (await import("@ext/loggers/opentelemetry/registerOtel")).registerOtel();
};

/** Raw `logging.level` setting: `Off` or a verbosity level; unknown/absent values fall back to `Important`. */
export const getStoredLogLevel = (): Level => {
	const raw = getCachedSetting("logging.level");
	return Object.values(Level).includes(raw as Level) ? (raw as Level) : Level.Important;
};

/** Min level to run the SDK with. Callers gate on `isLoggingEnabled()` first; a stored `Off` falls back to `Important`. */
export const getActiveLogLevel = (): Level => {
	const stored = getStoredLogLevel();
	return stored === Level.Off ? Level.Important : stored;
};

/** Push the min level to the Rust side so its `EnvFilter` reloads without restart. */
export const pushLogLevelToRust = async (level: Level): Promise<void> => {
	const environment = getExecutingEnvironment();
	if (environment === "tauri") {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("set_otel_level", { level });
	} else if (environment === "web") {
		// biome-ignore lint/suspicious/noExplicitAny: worker handle is untyped on window
		(window as any).wasm?.postMessage({ type: "set-otel-level", rank: levelRank(level) });
	}
};

/**
 * Apply the min level at runtime: in-memory (TS capture filter) and Rust `EnvFilter`.
 * Persistence is the caller's concern (the settings form saves `logging.level`).
 */
export const applyLogLevel = async (level: Level): Promise<void> => {
	setLogLevel(level);
	await pushLogLevelToRust(level);
};

/**
 * Apply the logging entries of a just-saved settings patch (dot-path keys) at runtime.
 * Settings persist only on the form's save, so runtime side effects fire here, not on toggle.
 * `logging.level` carries the on/off state too: `Off` soft-disables the SDK, a level enables it.
 * `logging.console` needs no action — it is read live at export time.
 */
export const applyLoggingPatch = async (patch: Record<string, unknown>): Promise<void> => {
	if (!("logging.level" in patch)) return;
	const raw = patch["logging.level"];
	if (raw === Level.Off) {
		await applyLoggingEnabled(false);
		return;
	}
	await applyLoggingEnabled(true);
	await applyLogLevel(Object.values(Level).includes(raw as Level) ? (raw as Level) : Level.Important);
};
