import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import setWorkerProxy from "../../apps/web/src/logic/setWorkerProxy";

const applyWorkspaceServices = (workspaceConfig?: WorkspaceConfig): void => {
	if (getExecutingEnvironment() === "web") setWorkerProxy(workspaceConfig?.services?.gitProxy?.url);
};

export default applyWorkspaceServices;
