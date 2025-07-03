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

export const useSyncCount = (catalogName: string): UseSyncCountReturn => {
	const context = GlobalSyncCountService.context();

	const syncCount = context.syncCounts[catalogName];

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
