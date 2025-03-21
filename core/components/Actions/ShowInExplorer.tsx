import resolveModule from "@app/resolveModule/frontend";
import ButtonLink from "@components/Molecules/ButtonLink";
import IsMacService from "@core-ui/ContextServices/IsMac";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import Path from "@core/FileProvider/Path/Path";
import t from "@ext/localization/locale/translate";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";

export default ({ item }: { item: ClientArticleProps }) => {
	const { isTauri } = usePlatform();
	if (!isTauri) return;

	const isMac = IsMacService.value;
	const workspace = WorkspaceService.current();

	if (!workspace) return null;

	const path = new Path(workspace.path).join(new Path(item.ref.path)).parentDirectoryPath.value;

	return (
		<ButtonLink
			onClick={() => resolveModule("openInExplorer")?.(path)}
			iconCode="folder-open"
			text={isMac ? t("open-in.finder") : t("open-in.explorer")}
		/>
	);
};
