import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersService from "@core-ui/ContextServices/CatalogFetchTimers";
import isOfflineService from "@core-ui/ContextServices/IsOfflineService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import assert from "assert";
import { createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CatalogSyncValue = {
	pull: number;
	push: number;
	hasChanges: boolean;
	errorMessage?: string;
};

export type CatalogSyncValues = {
	[catalogName: string]: CatalogSyncValue;
};

type GlobalSyncCountContextType = {
	syncCounts: CatalogSyncValues;
	totalPullCount: number;
	isLoading: boolean;
	updateSyncCount: (name: string, value: CatalogSyncValue) => void;
	removeSyncCount: (name: string) => void;
	fetchSyncCounts: (fetch: boolean) => Promise<void>;
};

const FOCUS_REFRESH_DELAY = 5000;

const GlobalSyncCountContext = createContext<GlobalSyncCountContextType | null>(null);

export default class GlobalSyncCountService {
	static Init({ children }: { children: ReactElement }): ReactElement {
		return <GlobalSyncCountService.Provider>{children}</GlobalSyncCountService.Provider>;
	}

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const isOffline = isOfflineService.value;

		const shouldFetch = !pageDataContext.conf.isReadOnly && !isOffline;
		const key = `${WorkspaceService.current()?.name}_all`;
		const hasWorkspace = WorkspaceService.hasActive();

		const [syncCounts, setSyncCounts] = useState<CatalogSyncValues>({});
		const [isLoading, setIsLoading] = useState(false);
		const lastFocusTimeRef = useRef(Date.now());

		const updateSyncCount = useCallback((name: string, value: CatalogSyncValue) => {
			setSyncCounts((prev) => ({ ...prev, [name]: value }));
		}, []);

		const removeSyncCount = useCallback((name: string) => {
			setSyncCounts((prev) => {
				const { [name]: removed, ...rest } = prev;
				return rest;
			});
		}, []);

		const totalPullCount = useMemo(() => {
			return Object.values(syncCounts).filter((v) => v.pull > 0 || v.hasChanges).length;
		}, [syncCounts]);

		const fetchSyncCounts = useCallback(
			async (fetch = false) => {
				if (!hasWorkspace || !shouldFetch) return;

				const actualFetch = fetch || CatalogFetchTimersService.canFetch(key);

				try {
					setIsLoading(true);
					if (actualFetch) CatalogFetchTimersService.setTimer(key);
					const endpoint = apiUrlCreator.getAllSyncCountUrl(actualFetch, true);
					const response = await FetchService.fetch(endpoint);

					if (response.ok) {
						const fetchedCounts = await response.json();
						setSyncCounts(fetchedCounts);
					}
				} catch (error) {
					console.error("Failed to fetch sync counts:", error);
				} finally {
					setIsLoading(false);
				}
			},
			[hasWorkspace, shouldFetch, key, apiUrlCreator],
		);

		useEffect(() => {
			if (!shouldFetch || !hasWorkspace) return;
			fetchSyncCounts(false);
		}, [shouldFetch, hasWorkspace, fetchSyncCounts]);

		useEffect(() => {
			if (!shouldFetch) return;

			const interval = setInterval(() => fetchSyncCounts(true), CatalogFetchTimersService.fetchIntervalDelay);
			return () => clearInterval(interval);
		}, [shouldFetch, fetchSyncCounts]);

		// useEffect(() => {
		// void resolveModule("setBadge")?.(totalPullCount > 0 ? totalPullCount : null);
		// }, [totalPullCount]);

		useEffect(() => {
			const handleFocus = () => {
				if (shouldFetch && Date.now() - lastFocusTimeRef.current > FOCUS_REFRESH_DELAY) {
					fetchSyncCounts(false);
					lastFocusTimeRef.current = Date.now();
				}
			};

			window.addEventListener("focus", handleFocus);
			return () => window.removeEventListener("focus", handleFocus);
		}, [shouldFetch, fetchSyncCounts]);

		const val = useMemo<GlobalSyncCountContextType>(
			() => ({
				syncCounts,
				updateSyncCount,
				removeSyncCount,
				fetchSyncCounts,
				totalPullCount,
				isLoading,
			}),
			[syncCounts, updateSyncCount, removeSyncCount, totalPullCount, isLoading],
		);

		return <GlobalSyncCountContext.Provider value={val}>{children}</GlobalSyncCountContext.Provider>;
	}

	static context(): GlobalSyncCountContextType {
		const context = useContext(GlobalSyncCountContext);
		assert(context, "GlobalSyncCountService hooks must be used within GlobalSyncCountService.Provider");
		return context;
	}
}
