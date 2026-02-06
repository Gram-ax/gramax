import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersService from "@core-ui/ContextServices/CatalogFetchTimers";
import isOfflineService from "@core-ui/ContextServices/IsOfflineService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import assert from "assert";
import { createContext, type ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type SyncableWorkspacesContext = {
	syncableWorkspaces: { [key: WorkspacePath]: number };
	isLoading: boolean;
	fetchSyncableWorkspaces: (fetch: boolean) => Promise<void>;
};

const SYNCABLE_WORKSPACES_FETCH_INTERVAL = 60 * 10 * 1000; // 10 mins

const SYNCABLE_WORKSPACES_FETCH_INTERVAL_DOUBLED = SYNCABLE_WORKSPACES_FETCH_INTERVAL * 2;

const SyncableWorkspacesContext = createContext<SyncableWorkspacesContext | null>(null);

export default class SyncableWorkspacesService {
	static Init({ children }: { children: ReactElement }): ReactElement {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const isOffline = isOfflineService.value;
		const fetchAllowed = !pageDataContext.conf.isReadOnly && !isOffline;
		const workspaces = WorkspaceService.workspaces();
		const currentWorkspace = WorkspaceService.current();

		const [isLoading, setIsLoading] = useState(false);
		const [syncableWorkspaces, setSyncableWorkspaces] = useState<{ [key: WorkspacePath]: number }>({});

		const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
		const lastFocusTimeRef = useRef(Date.now() - SYNCABLE_WORKSPACES_FETCH_INTERVAL);

		const endpoint = useMemo(() => apiUrlCreator.getAllSyncableWorkspacesUrl(), [apiUrlCreator]);

		const fetchSyncableWorkspaces = useCallback(
			async (fetch = false) => {
				if (!fetchAllowed) return;

				setIsLoading(true);
				try {
					const workspacesForFetch = fetch
						? workspaces.filter((w) => CatalogFetchTimersService.canFetch(`${w.name}_all`))
						: [];

					workspacesForFetch.forEach((w) => CatalogFetchTimersService.setTimer(`${w.name}_all`));

					const response = await FetchService.fetch(
						endpoint,
						JSON.stringify(workspacesForFetch.map((w) => w.path)),
					);

					if (response.ok) {
						const data = await response.json();
						setSyncableWorkspaces(data.workspaces);
					}
				} finally {
					setIsLoading(false);
				}
			},
			[fetchAllowed, endpoint],
		);

		useEffect(() => {
			fetchSyncableWorkspaces(false);
		}, [currentWorkspace?.path]);

		const fetchWorkspacesBackground = useCallback(
			async (delay: number): Promise<NodeJS.Timeout> => {
				if (!fetchAllowed) return null;

				clearTimeout(fetchTimeoutRef.current);
				return setTimeout(async () => {
					await fetchSyncableWorkspaces(true);
					fetchWorkspacesBackground(delay);
				}, delay);
			},
			[fetchSyncableWorkspaces, fetchAllowed],
		);

		const handleFocus = useCallback(async () => {
			if (Date.now() - lastFocusTimeRef.current >= SYNCABLE_WORKSPACES_FETCH_INTERVAL)
				await fetchSyncableWorkspaces(true);

			lastFocusTimeRef.current = Date.now();
			clearTimeout(fetchTimeoutRef.current);
			const timeout = await fetchWorkspacesBackground(SYNCABLE_WORKSPACES_FETCH_INTERVAL);
			fetchTimeoutRef.current = timeout;
		}, [fetchSyncableWorkspaces, fetchWorkspacesBackground]);

		const handleBlur = useCallback(async () => {
			lastFocusTimeRef.current = Date.now();

			clearTimeout(fetchTimeoutRef.current);
			const timeout = await fetchWorkspacesBackground(SYNCABLE_WORKSPACES_FETCH_INTERVAL_DOUBLED);
			fetchTimeoutRef.current = timeout;
		}, [fetchSyncableWorkspaces, fetchWorkspacesBackground]);

		useEffect(() => {
			window.addEventListener("focus", handleFocus);
			window.addEventListener("blur", handleBlur);
			return () => {
				window.removeEventListener("focus", handleFocus);
				window.removeEventListener("blur", handleBlur);
				clearTimeout(fetchTimeoutRef.current);
			};
		}, [fetchSyncableWorkspaces, handleFocus, handleBlur]);

		const value = useMemo(
			() => ({
				syncableWorkspaces,
				isLoading,
				fetchSyncableWorkspaces,
			}),
			[syncableWorkspaces, fetchSyncableWorkspaces, isLoading],
		);

		return <SyncableWorkspacesContext.Provider value={value}>{children}</SyncableWorkspacesContext.Provider>;
	}

	static Provider({ children, value }: { children: ReactElement; value: SyncableWorkspacesContext }): ReactElement {
		return <SyncableWorkspacesContext.Provider value={value}>{children}</SyncableWorkspacesContext.Provider>;
	}

	static context(): SyncableWorkspacesContext {
		const context = useContext(SyncableWorkspacesContext);
		assert(context, "SyncableWorkspacesService hooks must be used within SyncableWorkspacesService.Provider");
		return context;
	}
}
