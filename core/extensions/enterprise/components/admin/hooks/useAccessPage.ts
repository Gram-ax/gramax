import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useCallback } from "react";

export const useAccessPage = () => {
	const { ensureLoaded, isInitialLoading, isRefreshing, getTabError } = useSettings();
	const isLoading =
		isInitialLoading("resources") ||
		isInitialLoading("groups") ||
		isInitialLoading("editors") ||
		isInitialLoading("workspace") ||
		isRefreshing("resources") ||
		isRefreshing("groups") ||
		isRefreshing("editors") ||
		isRefreshing("workspace");

	const tabError =
		getTabError("resources") || getTabError("groups") || getTabError("editors") || getTabError("workspace");

	const retry = useCallback(() => {
		ensureLoaded("resources", true);
		ensureLoaded("groups", true);
		ensureLoaded("editors", true);
		ensureLoaded("workspace", true);
	}, [ensureLoaded]);

	return {
		isLoading,
		tabError,
		retry,
	};
};
