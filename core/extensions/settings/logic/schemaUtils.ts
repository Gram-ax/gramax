import type { Level, SettingEntry, Target } from "./settings";
import type { EffectiveSettings, StoredSettings } from "./types";

// biome-ignore lint/suspicious/noExplicitAny: runtime schema traversal
type AnyRecord = Record<string, any>;

const isSettingEntry = (value: AnyRecord): value is SettingEntry<AnyRecord> => {
	return value !== null && typeof value === "object" && "target" in value && "availableAt" in value;
};

const isPlainObject = (v: unknown): v is AnyRecord => v !== null && typeof v === "object";

/**
 * Walk the schema tree alongside values, applying `leaf` at each SettingEntry.
 * Drops keys where leaf returns undefined and empty nested objects.
 */
const walk = <S extends AnyRecord>(
	schema: S,
	values: AnyRecord | undefined,
	leaf: (entry: SettingEntry<AnyRecord>, value: AnyRecord) => AnyRecord | undefined,
): AnyRecord => {
	const out: AnyRecord = {};
	const keys = values ? Object.keys(values) : Object.keys(schema);
	for (const key of keys) {
		const entry = schema[key];
		if (entry === undefined) continue;
		if (isSettingEntry(entry)) {
			const v = leaf(entry, values?.[key]);
			if (v !== undefined) out[key] = v;
		} else if (isPlainObject(entry) && (values === undefined || isPlainObject(values[key]))) {
			const nested = walk(entry, values?.[key], leaf);
			if (Object.keys(nested).length > 0) out[key] = nested;
		}
	}
	return out;
};

const collectPaths = (schema: AnyRecord, match: (entry: SettingEntry<AnyRecord>) => boolean): string[] => {
	const paths: string[] = [];
	const find = (s: AnyRecord, prefix = "") => {
		for (const [k, v] of Object.entries(s)) {
			const path = prefix ? `${prefix}.${k}` : k;
			if (isSettingEntry(v)) {
				if (match(v)) paths.push(path);
			} else if (isPlainObject(v)) {
				find(v, path);
			}
		}
	};
	find(schema);
	return paths;
};

export const getOverridablePaths = (schema: AnyRecord): string[] =>
	collectPaths(schema, (e) => Boolean(e.clientOverridable));

export const getFixedPaths = (schema: AnyRecord): string[] => collectPaths(schema, (e) => !e.clientOverridable);

export const isClientOverridable = (schema: AnyRecord, key: string): boolean => {
	const entry = getSchemaEntry(schema, key);
	return entry?.clientOverridable ?? false;
};

export const projectByPaths = <T extends AnyRecord>(values: T, paths: string[]): Partial<T> => {
	const out: AnyRecord = {};
	for (const path of paths) {
		const v = getByPath(values, path);
		if (v !== undefined) setByPath(out, path, v);
	}
	return out as Partial<T>;
};

export const extractDefaults = <S extends AnyRecord>(schema: S): EffectiveSettings<S> => {
	return walk(schema, undefined, (e) =>
		e.default !== null && e.default !== undefined ? e.default : undefined,
	) as EffectiveSettings<S>;
};

export const filterByTarget = <S extends AnyRecord>(
	schema: S,
	values: StoredSettings<S>,
	target: Target,
): StoredSettings<S> => {
	return walk(schema, values as AnyRecord, (e, v) => (e.target & target ? v : undefined)) as StoredSettings<S>;
};

export const filterByLevel = <S extends AnyRecord>(
	schema: S,
	stored: StoredSettings<S>,
	level: Level,
): StoredSettings<S> => {
	return walk(schema, stored as AnyRecord, (e, v) => (e.availableAt & level ? v : undefined)) as StoredSettings<S>;
};

export const getByPath = <V = AnyRecord>(obj: AnyRecord, key: string): V | undefined => {
	const parts = key.split(".");
	let current: AnyRecord = obj;
	for (const part of parts) {
		if (current === null || typeof current !== "object") return undefined;
		current = current[part];
	}
	return current as V;
};

export const getSchemaEntry = <S extends AnyRecord>(schema: S, key: string): SettingEntry<AnyRecord> | undefined => {
	const found = getByPath<AnyRecord>(schema, key);
	return found !== undefined && isSettingEntry(found) ? found : undefined;
};

// biome-ignore lint/suspicious/noExplicitAny: leaf values can be primitives or objects
export const setByPath = (obj: AnyRecord, key: string, value: any): void => {
	const parts = key.split(".");
	let current = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const k = parts[i];
		if (current[k] === null || current[k] === undefined || typeof current[k] !== "object") {
			current[k] = {};
		}
		current = current[k];
	}
	current[parts[parts.length - 1]] = value;
};

/** Cleans up parent objects left empty by the delete. */
export const deleteByPath = (obj: AnyRecord, key: string): void => {
	const parts = key.split(".");
	if (parts.length === 0) return;
	if (parts.length === 1) {
		delete obj[parts[0]];
		return;
	}

	const parents: { obj: AnyRecord; key: string }[] = [];
	let current: AnyRecord = obj;

	for (let i = 0; i < parts.length - 1; i++) {
		if (current === null || typeof current !== "object") return;
		parents.push({ obj: current, key: parts[i] });
		current = current[parts[i]];
	}

	if (current !== null && typeof current === "object") {
		delete current[parts[parts.length - 1]];
	}

	for (let i = parents.length - 1; i >= 0; i--) {
		const child = parents[i].obj[parents[i].key];
		if (child !== null && typeof child === "object" && Object.keys(child).length === 0) {
			delete parents[i].obj[parents[i].key];
		} else {
			break;
		}
	}
};
