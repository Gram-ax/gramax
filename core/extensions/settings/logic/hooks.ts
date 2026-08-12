import type { PageProps } from "@components/Pages/models/Pages";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { PlatformServiceNew } from "@core-ui/PlatformService";
import { AppSettings } from "@ext/settings/levels/app-settings";
import {
	type AppSettingsKey,
	type AppSettingsValue,
	cachedSettingsStore,
} from "@ext/settings/logic/cachedSettingsStore";
import {
	extractDefaults,
	getByPath,
	getFixedPaths,
	getOverridablePaths,
	isClientOverridable,
	projectByPaths,
} from "@ext/settings/logic/schemaUtils";
import type { LevelName } from "@ext/settings/logic/settings";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";

const makeSelectByKey = <K extends AppSettingsKey>(key: K) => {
	return (s: { values: unknown; fixed: unknown }) => {
		const fixed = getByPath<AppSettingsValue<K>>(s.fixed as Record<string, unknown>, key);
		return fixed !== undefined ? fixed : getByPath<AppSettingsValue<K>>(s.values as Record<string, unknown>, key);
	};
};
type SettingsLevel = LevelName;

// Browser/Desktop: appStore is a local config.yaml on the user's disk, so settings
// changes belong on disk. DocPortal (hosted Next.js) shares config.yaml across all
// visitors and has no per-user workspace yaml, so it persists nothing — workspace and
// catalog overrides are read-only there; theme/language still live in the localStorage
// cache (the store `set` is not gated by this function).
const shouldPersistSettings = (_level: SettingsLevel) => {
	if (PlatformServiceNew.isDocPortal) return false;
	return PlatformServiceNew.isWeb || PlatformServiceNew.isDesktop;
};

/**
 * Imperative persist via FetchService — bypasses useApi's Loading-gate so
 * concurrent toggles don't silently drop. Backend serializes via setBatch
 * (read → mutate → write); last-write-wins on disk, which matches the
 * optimistic cache and post-reload hydration.
 */
const usePersistSettings = (level: SettingsLevel = "app") => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	return async (patch: Record<string, unknown>): Promise<void> => {
		if (!shouldPersistSettings(level)) return;
		if (!apiUrlCreator) return;
		if (Object.keys(patch).length === 0) return;
		const url = apiUrlCreator.getUpdateSettingURL(level);
		await FetchService.fetch(url, JSON.stringify(patch), MimeTypes.json, Method.POST);
	};
};

export const useSetting = <K extends AppSettingsKey>(
	key: K,
): [AppSettingsValue<K>, (value: AppSettingsValue<K>) => void] => {
	const selector = useMemo(() => makeSelectByKey(key), [key]);
	const value = useStore(cachedSettingsStore, selector);
	const persist = usePersistSettings();
	const set = (next: AppSettingsValue<K>) => {
		if (PlatformServiceNew.isHostedSsr && !isClientOverridable(AppSettings, key)) {
			return;
		}
		const prev = getByPath<AppSettingsValue<K>>(
			cachedSettingsStore.getState().values as Record<string, unknown>,
			key,
		);
		cachedSettingsStore.getState().set(key, next);
		void persist({ [key]: next }).catch(() => {
			const current = getByPath<AppSettingsValue<K>>(
				cachedSettingsStore.getState().values as Record<string, unknown>,
				key,
			);
			// Identity compare holds for object values too: cloneAndSet inserts
			// patch values by reference. An intervening write clones the tree,
			// breaks identity, and safely skips the rollback.
			if (current === next) cachedSettingsStore.getState().set(key, prev as AppSettingsValue<K>);
		});
	};
	return [value, set];
};

/**
 * Optimistically apply a patch to the cached store for the given level.
 * App level: mirrors into effective values only where no workspace override
 * masks the key. Workspace level: a cleared value ("" / null) removes the
 * override, so the effective value falls back to the app-level one.
 */
const applyPatchToStore = (level: SettingsLevel, patch: Record<string, unknown>): void => {
	const state = cachedSettingsStore.getState();
	if (level === "app") {
		const nowApp = state.appValues as Record<string, unknown>;
		const nowEffective = state.values as Record<string, unknown>;
		const effectivePatch: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(patch)) {
			if (getByPath(nowApp, key) === getByPath(nowEffective, key)) {
				effectivePatch[key] = value;
			}
		}

		state.setManyApp(patch);
		if (Object.keys(effectivePatch).length > 0) state.setMany(effectivePatch);
	} else if (level === "workspace") {
		const nowApp = state.appValues as Record<string, unknown>;
		const effectivePatch: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(patch)) {
			if (value === "" || value === null) {
				const appVal = getByPath(nowApp, key);
				effectivePatch[key] = appVal !== undefined ? appVal : "";
			} else {
				effectivePatch[key] = value;
			}
		}
		state.setMany(effectivePatch);
	}
};

export const useUpdateSettings = (
	level: SettingsLevel = "app",
): ((patch: Record<string, unknown>) => Promise<void>) => {
	const persist = usePersistSettings(level);
	return async (patch) => {
		const filteredPatch = { ...patch };
		if (PlatformServiceNew.isHostedSsr) {
			for (const key of Object.keys(filteredPatch)) {
				if (!isClientOverridable(AppSettings, key)) delete filteredPatch[key];
			}
		}
		if (Object.keys(filteredPatch).length === 0) return;

		const snapshot = cachedSettingsStore.getState().values as Record<string, unknown>;
		const prev: Record<string, unknown> = {};
		for (const key of Object.keys(filteredPatch)) prev[key] = getByPath(snapshot, key);

		applyPatchToStore(level, filteredPatch);

		try {
			await persist(filteredPatch);
		} catch (err) {
			if (level === "app") {
				const now = cachedSettingsStore.getState().appValues as Record<string, unknown>;
				const rollback: Record<string, unknown> = {};
				const rollbackEffective: Record<string, unknown> = {};
				for (const [key, value] of Object.entries(filteredPatch)) {
					if (getByPath(now, key) === value) {
						rollback[key] = prev[key];
						rollbackEffective[key] = getByPath(snapshot, key);
					}
				}
				if (Object.keys(rollback).length > 0) cachedSettingsStore.getState().setManyApp(rollback);
				if (Object.keys(rollbackEffective).length > 0)
					cachedSettingsStore.getState().setMany(rollbackEffective);
			} else if (level === "workspace") {
				cachedSettingsStore.getState().setMany(prev);
			}
			throw err;
		}
	};
};

export const useResetSettings = (level: SettingsLevel = "app"): ((keys: string[]) => Promise<void>) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	return async (keys) => {
		if (!shouldPersistSettings(level)) return;
		if (!apiUrlCreator || keys.length === 0) return;

		const defaults = extractDefaults(AppSettings) as Record<string, unknown>;
		const snapshot = cachedSettingsStore.getState().values as Record<string, unknown>;
		const prev: Record<string, unknown> = {};
		const resetPatch: Record<string, unknown> = {};

		for (const key of keys) {
			prev[key] = getByPath(snapshot, key);
			resetPatch[key] = getByPath(defaults, key);
		}

		applyPatchToStore(level, resetPatch);

		try {
			const url = apiUrlCreator.getResetSettingURL(level);
			await FetchService.fetch(url, JSON.stringify({ keys }), MimeTypes.json, Method.POST);
		} catch (err) {
			if (level === "app") {
				cachedSettingsStore.getState().setManyApp(prev);
				cachedSettingsStore.getState().setMany(prev);
			} else if (level === "workspace") {
				cachedSettingsStore.getState().setMany(prev);
			}
			throw err;
		}
	};
};

export const useSettingEffect = <K extends AppSettingsKey>(
	key: K,
	effect: (value: AppSettingsValue<K>, prev: AppSettingsValue<K> | undefined) => void,
): void => {
	const effectRef = useRef(effect);
	effectRef.current = effect;

	useLayoutEffect(() => {
		let prev = getByPath<AppSettingsValue<K>>(
			cachedSettingsStore.getState().values as Record<string, unknown>,
			key,
		);

		return cachedSettingsStore.subscribe((s) => {
			const next = getByPath<AppSettingsValue<K>>(s.values as Record<string, unknown>, key);
			if (Object.is(next, prev)) return;
			const before = prev;
			prev = next;
			effectRef.current(next, before);
		});
	}, [key]);
};

export const useHydrateSettings = (pageProps?: PageProps): void => {
	const didHydrate = useRef(false);
	useEffect(() => {
		if (didHydrate.current) return;
		didHydrate.current = true;

		const incoming = pageProps?.context?.settings as Record<string, unknown> | undefined;
		const incomingApp = pageProps?.context?.appSettings as Record<string, unknown> | undefined;

		if (PlatformServiceNew.isHostedSsr) {
			if (incoming) {
				const fixed = projectByPaths(incoming, getFixedPaths(AppSettings));
				const overridable = projectByPaths(incoming, getOverridablePaths(AppSettings));
				cachedSettingsStore.getState().setFixed(fixed);
				cachedSettingsStore.getState().hydrate(overridable, { localWins: true });
			}
			if (incomingApp) {
				const overridableApp = projectByPaths(incomingApp, getOverridablePaths(AppSettings));
				cachedSettingsStore.getState().hydrateApp(overridableApp, { localWins: true });
			}
		} else {
			cachedSettingsStore.getState().setFixed({});
			if (incoming) cachedSettingsStore.getState().hydrate(incoming, { localWins: false });
			if (incomingApp) cachedSettingsStore.getState().hydrateApp(incomingApp, { localWins: false });
		}
	}, [pageProps?.context?.settings, pageProps?.context?.appSettings]);
};
