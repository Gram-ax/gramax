import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";

const ScopeWrapper = ({ children, scope }: { children: JSX.Element; scope: TreeReadScope }) => {
	if (!scope) return children;
	return <ResourceService.Provider scope={scope}>{children}</ResourceService.Provider>;
};

export default ScopeWrapper;
