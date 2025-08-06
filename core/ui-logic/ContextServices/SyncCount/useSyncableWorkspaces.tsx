import { useGlobalSyncCount } from "@core-ui/ContextServices/SyncCount/useSyncCount";
import Workspace from "@core-ui/ContextServices/Workspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { useMemo } from "react";
import GlobalSyncableWorkspacesService from "./SyncableWorkspaces";

export interface UseSyncableWorkspacesReturn {
	syncableWorkspaces: { [key: WorkspacePath]: number };
	isLoading: boolean;
	fetchSyncableWorkspaces: (fetch: boolean) => Promise<void>;
	hasSyncableWorkspaces: boolean;
	syncableWorkspacesCount: number;
	isCurrentWorkspaceSyncable: boolean;
}

export const useSyncableWorkspaces = (): UseSyncableWorkspacesReturn => {
	const context = GlobalSyncableWorkspacesService.context();
	const syncCounts = useGlobalSyncCount()?.syncCounts || {};

	const syncCountsLen = Object.values(syncCounts).filter((count) => count.hasChanges).length;
	const currentWorkspace = Workspace.current();

	const { hasSyncableWorkspaces, syncableWorkspacesCount, syncableWorkspaces } = useMemo(() => {
		return {
			hasSyncableWorkspaces: Object.keys(context.syncableWorkspaces).length > 0 || syncCountsLen > 0,
			syncableWorkspacesCount: Object.keys(context.syncableWorkspaces).length + (syncCountsLen > 0 ? 1 : 0),
			syncableWorkspaces:
				syncCountsLen > 0
					? {
							...context.syncableWorkspaces,
							[currentWorkspace.path]: syncCountsLen,
					  }
					: context.syncableWorkspaces,
		};
	}, [context.syncableWorkspaces, syncCounts, syncCountsLen, currentWorkspace]);

	return {
		syncableWorkspaces: syncableWorkspaces,
		isLoading: context.isLoading,
		fetchSyncableWorkspaces: context.fetchSyncableWorkspaces,
		hasSyncableWorkspaces,
		isCurrentWorkspaceSyncable: syncableWorkspaces[currentWorkspace.path] > 0,
		syncableWorkspacesCount,
	};
};
