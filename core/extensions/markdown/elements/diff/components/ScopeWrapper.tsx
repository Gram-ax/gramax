import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";

const ScopeWrapper = ({ children, scope }: { children: JSX.Element; scope: TreeReadScope }) => {
	if (!scope) return children;
	return <OnLoadResourceService.Provider scope={scope}>{children}</OnLoadResourceService.Provider>;
};

export default ScopeWrapper;
