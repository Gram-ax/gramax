import type { SettingEntry } from "./settings";

/**
 * Recursively unwraps SettingEntry<T> → T | undefined.
 * This is the shape stored in YAML `settings` keys — only overridden values present.
 */
export type StoredSettings<S> = {
	[K in keyof S]?: S[K] extends SettingEntry<infer T> ? T : S[K] extends object ? StoredSettings<S[K]> : never;
};

/**
 * Recursively unwraps SettingEntry<T> → T.
 * This is the fully resolved shape after merging all levels — every value guaranteed.
 */
export type EffectiveSettings<S> = {
	[K in keyof S]: S[K] extends SettingEntry<infer T> ? T : S[K] extends object ? EffectiveSettings<S[K]> : never;
};

/**
 * Dot-notation path keys derived from a settings schema.
 * E.g. "general.language" | "services.git-proxy" | "enterprise.endpoint"
 */
type SettingsKeyImpl<S, Prefix extends string = ""> = {
	[K in keyof S & string]: S[K] extends SettingEntry<infer _T>
		? Prefix extends ""
			? K
			: `${Prefix}.${K}`
		: S[K] extends object
			? SettingsKeyImpl<S[K], Prefix extends "" ? K : `${Prefix}.${K}`>
			: never;
}[keyof S & string];

export type SettingsKey<S> = SettingsKeyImpl<S>;

/**
 * Resolve the value type for a given dot-notation key.
 */
type ResolveKeyImpl<S, K extends string> = K extends `${infer Head}.${infer Tail}`
	? Head extends keyof S
		? ResolveKeyImpl<S[Head], Tail>
		: never
	: K extends keyof S
		? S[K] extends SettingEntry<infer T>
			? T
			: never
		: never;

export type SettingsValue<S, K extends string> = ResolveKeyImpl<S, K>;

/**
 * Info about a setting's override status at a given level.
 */
export type OverrideInfo<T> = {
	isOverridden: boolean;
	value: T | undefined;
};
