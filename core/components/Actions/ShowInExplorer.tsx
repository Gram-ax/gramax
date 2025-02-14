import resolveModule from "@app/resolveModule/frontend";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsMacService from "@core-ui/ContextServices/IsMac";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import Path from "@core/FileProvider/Path/Path";
import t from "@ext/localization/locale/translate";

export default () => {
	const { isTauri } = usePlatform();
	if (!isTauri) return;

	const isMac = IsMacService.value;
	const articleProps = ArticlePropsService.value;
	const workspace = WorkspaceService.current();

	if (!workspace) return null;

	const path = new Path(workspace.path).join(new Path(articleProps.ref.path)).parentDirectoryPath.value;

	return (
		<ListItem
			onClick={() => resolveModule("openInExplorer")?.(path)}
			iconCode="folder-open"
			text={isMac ? t("open-in.finder") : t("open-in.explorer")}
		/>
	);
};
