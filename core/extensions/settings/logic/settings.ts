import type { Environment } from "@app/resolveModule/env";

export enum Target {
	none = 0,
	web = 1 << 0,
	desktop = 1 << 1,
	docportal = 1 << 2,
	static = 1 << 3,
	all = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3),
}

export const ENVIRONMENT_TARGET: Record<Environment, Target> = {
	web: Target.web,
	tauri: Target.desktop,
	docportal: Target.docportal,
	static: Target.static,
	// "next" is the docportal SSR runtime; "test" aliases "next" (see env.ts).
	next: Target.docportal,
	test: Target.docportal,
	cli: Target.all,
};

export enum Level {
	app = 1 << 0,
	workspace = 1 << 1,
	catalog = 1 << 2,
}

// Single source of truth for the settings-level string literal — the HTTP
// API, ApiUrlCreator, and the FE hooks all talk levels by name, not by the
// `Level` bitflag (which exists to OR-combine `availableAt` in schema entries).
export type LevelName = "app" | "workspace" | "catalog";

export type SettingEntry<T> = {
	target: Target;
	default: T | null;
	availableAt: Level;
	clientOverridable: boolean;
};

type SettingDefinition<T> = Partial<Omit<SettingEntry<T>, "availableAt">> & { availableAt: Level };

export const setting = <T>(e: SettingDefinition<T>): SettingEntry<T> => ({
	target: e.target ?? Target.all,
	default: e.default ?? null,
	availableAt: e.availableAt,
	clientOverridable: e.clientOverridable ?? false,
});
