import mergeObjects from "@core/utils/mergeObjects";
import { PlatformServiceNew } from "@core-ui/PlatformService";
import { AppSettings } from "@ext/settings/levels/app-settings";
import { cookieStorage } from "@ext/settings/logic/cookieStorage";
import {
	extractDefaults,
	getByPath,
	getOverridablePaths,
	projectByPaths,
	setByPath,
} from "@ext/settings/logic/schemaUtils";
import type { EffectiveSettings, SettingsKey, SettingsValue } from "@ext/settings/logic/types";
import { createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Schema = typeof AppSettings;
type Values = EffectiveSettings<Schema>;
export type AppSettingsKey = SettingsKey<Schema>;
export type AppSettingsValue<K extends AppSettingsKey> = SettingsValue<Schema, K>;

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type HydrateOptions = { localWins?: boolean };

type State = {
	values: Values;
	appValues: Values;
	fixed: DeepPartial<Values>;
	set: <K extends AppSettingsKey>(key: K, value: AppSettingsValue<K>) => void;
	setMany: (patch: Record<string, unknown>) => void;
	setManyApp: (patch: Record<string, unknown>) => void;
	hydrate: (incoming: Partial<Values> | undefined, opts?: HydrateOptions) => void;
	hydrateApp: (incoming: Partial<Values> | undefined, opts?: HydrateOptions) => void;
	setFixed: (next: DeepPartial<Values>) => void;
};

export const SETTINGS_STORAGE_KEY = "app-settings-cache";
export const SETTINGS_STORAGE_VERSION = 1;

// Patch values land by reference (no clone of the values themselves) — the
// optimistic-rollback identity compare in hooks.ts relies on this.
const cloneAndSet = (values: Values, patch: Record<string, unknown>): Values => {
	const next = structuredClone(values);
	for (const [key, value] of Object.entries(patch)) setByPath(next as Record<string, unknown>, key, value);
	return next;
};

// DocPortal stores in cookies so SSR can read them on first paint. Other
// platforms keep localStorage — it has no size limit and no per-request cost,
// and their server (if any) shares the same machine as the client.
const storage =
	typeof window !== "undefined"
		? createJSONStorage(() => (PlatformServiceNew.isDocPortal ? cookieStorage : localStorage))
		: undefined;

export const cachedSettingsStore = createStore<State>()(
	persist(
		(set, get) => ({
			values: extractDefaults(AppSettings),
			appValues: extractDefaults(AppSettings),
			fixed: {},
			set: (key, value) => set({ values: cloneAndSet(get().values, { [key]: value }) }),
			setMany: (patch) => set({ values: cloneAndSet(get().values, patch) }),
			setManyApp: (patch) => set({ appValues: cloneAndSet(get().appValues, patch) }),
			hydrate: (incoming, opts) => {
				if (!incoming) return;
				const current = get().values;
				const merged = opts?.localWins
					? mergeObjects<Values>(incoming, current)
					: mergeObjects<Values>(current, incoming);
				set({ values: merged });
			},
			hydrateApp: (incoming, opts) => {
				if (!incoming) return;
				const current = get().appValues;
				const merged = opts?.localWins
					? mergeObjects<Values>(incoming, current)
					: mergeObjects<Values>(current, incoming);
				set({ appValues: merged });
			},
			setFixed: (fixed) => set({ fixed }),
		}),
		{
			name: SETTINGS_STORAGE_KEY,
			storage,
			version: SETTINGS_STORAGE_VERSION,
			skipHydration: typeof window === "undefined",
			// Cookies travel with every request — persist only the paths SSR
			// actually needs (clientOverridable: theme, language) on DocPortal.
			partialize: (s) => ({
				values: PlatformServiceNew.isDocPortal
					? (projectByPaths(s.values, getOverridablePaths(AppSettings)) as Values)
					: s.values,
			}),
			// Deep-merge over fresh defaults instead of the default shallow
			// replace: the persisted blob may be sparse (DocPortal projection)
			// or predate newly added schema keys.
			merge: (persisted, current) => {
				const incoming = persisted as
					| { values?: DeepPartial<Values>; appValues?: DeepPartial<Values> }
					| undefined;
				return {
					...current,
					values: incoming?.values ? mergeObjects<Values>(current.values, incoming.values) : current.values,
					appValues: incoming?.appValues
						? mergeObjects<Values>(current.appValues, incoming.appValues)
						: current.appValues,
				};
			},
		},
	),
);

export const getCachedSetting = <K extends AppSettingsKey>(key: K): AppSettingsValue<K> => {
	const state = cachedSettingsStore.getState();
	const fixed = getByPath<AppSettingsValue<K>>(state.fixed as Record<string, unknown>, key);
	return fixed !== undefined ? fixed : getByPath<AppSettingsValue<K>>(state.values as Record<string, unknown>, key);
};
