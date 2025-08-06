import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersService from "@core-ui/ContextServices/CatalogFetchTimers";
import isOfflineService from "@core-ui/ContextServices/IsOfflineService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import assert from "assert";
import { createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SyncableWorkspacesContext = {
	syncableWorkspaces: { [key: WorkspacePath]: number };
	isLoading: boolean;
	fetchSyncableWorkspaces: (fetch: boolean) => Promise<void>;
};

const SYNCABLE_WORKSPACES_FETCH_INTERVAL = 60 * 15 * 1000; // 15 mins

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

		useEffect(() => {
			const interval = setInterval(() => fetchSyncableWorkspaces(true), SYNCABLE_WORKSPACES_FETCH_INTERVAL);
			return () => clearInterval(interval);
		}, [fetchSyncableWorkspaces]);

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
