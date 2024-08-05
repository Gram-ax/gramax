import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Path from "@core/FileProvider/Path/Path";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { ReactElement } from "react";
import ApiUrlCreatorService from "./ApiUrlCreator";

export default abstract class WorkspaceService {
	private static _apiUrlCreator: ApiUrlCreator;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		WorkspaceService._apiUrlCreator = ApiUrlCreatorService.value;
		return children;
	}

	static current() {
		return PageDataContextService.value.workspace.workspaces.find(
			(w) => w.path == PageDataContextService.value.workspace.current,
		);
	}

	static hasActive() {
		return !!PageDataContextService.value.workspace.current;
	}

	static workspaces() {
		return PageDataContextService.value.workspace.workspaces;
	}

	static defaultPath() {
		return new Path(PageDataContextService.value.workspace.defaultPath).parentDirectoryPath.value;
	}

	static async setActive(workspace: WorkspacePath) {
		clearData();
		await FetchService.fetch(WorkspaceService._apiUrlCreator.switchWorkspace(workspace));
		await refreshPage();
	}
}
