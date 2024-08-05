import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogFetchTimersService from "@core-ui/ContextServices/CatalogFetchTimers";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { createContext, ReactElement, useContext, useEffect, useState } from "react";

type CatalogSyncValue = {
	pull: number;
	push: number;
	hasChanges: boolean;
	errorMessage?: string;
};

type CatalogSyncValues = {
	[name: string]: CatalogSyncValue;
};

const CatalogSyncContext = createContext<CatalogSyncValues>(undefined);

export default abstract class CatalogSyncService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const shouldDisplay = !pageDataContext.conf.isReadOnly;
		const shouldFetch = !IsOfflineService.value && shouldDisplay;
		const key = `${WorkspaceService.current()?.name}_all`;
		const hasWorkspace = WorkspaceService.hasActive();

		const [syncCount, setSyncCount] = useState<CatalogSyncValues>();

		const fetchInBackground = async () => {
			if (!hasWorkspace || !shouldFetch || !CatalogFetchTimersService.canFetch(key)) return;
			const updatedRes = await FetchService.fetch(apiUrlCreator.getAllSyncCountUrl(true));
			setSyncCount(await updatedRes.json());
			CatalogFetchTimersService.setTimer(key);
		};

		useEffect(() => {
			if (!shouldDisplay) return;

			(async () => {
				const res = await FetchService.fetch(apiUrlCreator.getAllSyncCountUrl(false));
				setSyncCount(await res.json());
				fetchInBackground();
			})();

			const interval = setInterval(fetchInBackground, CatalogFetchTimersService.fetchIntervalDelay);
			return () => clearInterval(interval);
		}, [shouldDisplay, PageDataContextService.value.workspace.current]);

		return <CatalogSyncContext.Provider value={syncCount}>{children}</CatalogSyncContext.Provider>;
	}

	static getSyncCount(name: string): CatalogSyncValue {
		return useContext(CatalogSyncContext)?.[name];
	}
}
