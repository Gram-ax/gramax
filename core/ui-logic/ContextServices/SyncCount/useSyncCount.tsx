import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import { useIsRepoOk } from "@ext/storage/logic/utils/useStorage";
import { useCallback, useMemo } from "react";
import GlobalSyncCountService, { CatalogSyncValue, CatalogSyncValues } from "./GlobalSyncCount";

export interface UseSyncCountReturn {
	syncCount: CatalogSyncValue | undefined;
	updateSyncCount: (value: CatalogSyncValue) => void;
	removeSyncCount: () => void;
	isLoading: boolean;
}

export interface UseGlobalSyncCountResult {
	syncCounts: CatalogSyncValues;
	totalPullCount: number;
	hasAnyChanges: boolean;
	hasAnyErrors: boolean;
	isLoading: boolean;
	fetchSyncCounts: (fetch: boolean) => Promise<void>;
}

export const useSyncCount = (catalog: string | CatalogLink): UseSyncCountReturn => {
	const context = GlobalSyncCountService.context();

	const catalogName = typeof catalog === "string" ? catalog : catalog.name;
	const isCloning = typeof catalog === "object" && catalog.isCloning;
	const isBroken = (!useIsRepoOk(null, false) || (typeof catalog === "object" && catalog.broken)) && !isCloning;

	const syncCount = context.syncCounts[catalogName];

	if (isBroken && syncCount) syncCount.errorMessage = t("git.error.broken.tooltip");

	const updateSyncCount = useCallback(
		(value: CatalogSyncValue) => {
			context.updateSyncCount(catalogName, value);
		},
		[catalogName, context.updateSyncCount],
	);

	const removeSyncCount = useCallback(() => {
		context.removeSyncCount(catalogName);
	}, [catalogName, context.removeSyncCount]);

	return {
		syncCount,
		updateSyncCount,
		removeSyncCount,
		isLoading: context.isLoading,
	};
};

export const useGlobalSyncCount = (): UseGlobalSyncCountResult => {
	const context = GlobalSyncCountService.context();

	const { hasAnyChanges, hasAnyErrors } = useMemo(() => {
		const counts = Object.values(context.syncCounts);
		return {
			hasAnyChanges: counts.some((count) => count.hasChanges),
			hasAnyErrors: counts.some((count) => !!count.errorMessage),
		};
	}, [context.syncCounts]);

	return {
		syncCounts: context.syncCounts,
		totalPullCount: context.totalPullCount,
		fetchSyncCounts: context.fetchSyncCounts,
		isLoading: context.isLoading,
		hasAnyChanges,
		hasAnyErrors,
	};
};
