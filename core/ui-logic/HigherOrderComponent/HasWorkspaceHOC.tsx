import { ReactNode } from "react";
import PageDataContextService from "../ContextServices/PageDataContext";

const HasWorkspaceHOC = ({ children }: { children: ReactNode }) => {
	if (!PageDataContextService.value.workspace.current) return null;
	return children;
};

export default HasWorkspaceHOC;
