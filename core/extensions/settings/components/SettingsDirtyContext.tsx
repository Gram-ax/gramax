import { createContext, useContext, useEffect } from "react";

/**
 * Bridges a level body (workspace/catalog) that owns its own react-hook-form
 * to AppSettingsEditor's unsaved-changes guard, which otherwise only sees the
 * app-level form. The active child reports its dirty state and registers its
 * own submit, so the guard's "Save and close" saves the child form instead of
 * silently persisting the (clean) app form and dropping the child's edits.
 */
type SettingsDirtyContextValue = {
	reportDirty: (dirty: boolean) => void;
	registerSave: (save: (() => Promise<void>) | null) => void;
};

const SettingsDirtyContext = createContext<SettingsDirtyContextValue | null>(null);

export const SettingsDirtyProvider = SettingsDirtyContext.Provider;

/**
 * Reports `isDirty` up to the guard whenever it changes, and resets to `false`
 * on unmount. No-op when rendered outside AppSettingsEditor (standalone use).
 */
export const useReportSettingsDirty = (isDirty: boolean) => {
	const ctx = useContext(SettingsDirtyContext);
	useEffect(() => {
		ctx?.reportDirty(isDirty);
		return () => ctx?.reportDirty(false);
	}, [ctx, isDirty]);
};

/**
 * Registers the body's own submit with the guard and unregisters on unmount.
 * `save` must be referentially stable (useCallback) to avoid re-register churn.
 * No-op when rendered outside AppSettingsEditor (standalone use).
 */
export const useRegisterSettingsSave = (save: () => Promise<void>) => {
	const ctx = useContext(SettingsDirtyContext);
	useEffect(() => {
		ctx?.registerSave(save);
		return () => ctx?.registerSave(null);
	}, [ctx, save]);
};
