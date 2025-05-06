import { PageProps } from "@components/ContextProviders";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ContextService from "@core-ui/ContextServices/ContextService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Path from "@core/FileProvider/Path/Path";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { createContext, ReactElement, useContext, useMemo } from "react";

const WorkspaceServiceContext = createContext<ClientWorkspaceConfig>(null);

class WorkspaceService implements ContextService {
	Init({ children, pageProps }: { pageProps: PageProps; children: ReactElement }): ReactElement {
		const workspaces = pageProps?.context?.workspace?.workspaces;
		const currentPath = pageProps?.context?.workspace?.current;

		const current = useMemo(() => workspaces.find((w) => w.path == currentPath), [workspaces, currentPath]);

		return <WorkspaceServiceContext.Provider value={current}>{children}</WorkspaceServiceContext.Provider>;
	}

	current() {
		return useContext(WorkspaceServiceContext);
	}

	hasActive() {
		return !!useContext(WorkspaceServiceContext);
	}

	workspaces() {
		return PageDataContextService.value.workspace.workspaces;
	}

	defaultPath() {
		return new Path(PageDataContextService.value.workspace.defaultPath).parentDirectoryPath.value;
	}

	async setActive(workspace: WorkspacePath, apiUrlCreator: ApiUrlCreator, refresh = true) {
		if (refresh) clearData();
		await FetchService.fetch(apiUrlCreator.switchWorkspace(workspace));
		if (refresh) await refreshPage();
	}
}

export default new WorkspaceService();
