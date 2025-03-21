import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Path from "@core/FileProvider/Path/Path";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { ReactElement } from "react";
import ApiUrlCreatorService from "./ApiUrlCreator";

export type WorkspaceServiceProps = {
	children: ReactElement;
	current: WorkspacePath;
	workspaces: ClientWorkspaceConfig[];
};

export default abstract class WorkspaceService {
	private static _apiUrlCreator: ApiUrlCreator;
	private static _workspaces: ClientWorkspaceConfig[] = [];
	private static _current: ClientWorkspaceConfig;

	static Provider({ children, current, workspaces }: WorkspaceServiceProps): ReactElement {
		WorkspaceService._apiUrlCreator = ApiUrlCreatorService.value;
		WorkspaceService._workspaces = workspaces;
		WorkspaceService._current = workspaces.find((w) => w.path == current);

		return children;
	}

	static current() {
		return WorkspaceService._current;
	}

	static hasActive() {
		return !!WorkspaceService._current;
	}

	static workspaces() {
		return WorkspaceService._workspaces;
	}

	static defaultPath() {
		return new Path(PageDataContextService.value.workspace.defaultPath).parentDirectoryPath.value;
	}

	static async setActive(workspace: WorkspacePath, refresh = true) {
		if (refresh) clearData();
		await FetchService.fetch(WorkspaceService._apiUrlCreator.switchWorkspace(workspace));
		if (refresh) await refreshPage();
	}
}
