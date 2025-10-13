import resolveModule from "@app/resolveModule/frontend";
import Icon from "@components/Atoms/Icon";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsMacService from "@core-ui/ContextServices/IsMac";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import Path from "@core/FileProvider/Path/Path";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";

export default ({ item }: { item?: ClientArticleProps }) => {
	const { isTauri } = usePlatform();
	if (!isTauri) return;

	const catalog = CatalogPropsService.value;

	const isMac = IsMacService.value;
	const workspace = WorkspaceService.current();

	if (!workspace) return null;

	const path = item
		? new Path(workspace.path).join(new Path(item.ref.path)).parentDirectoryPath.value
		: new Path(workspace.path).join(new Path(catalog.name)).value;

	return (
		<DropdownMenuItem onSelect={() => resolveModule("openInExplorer")?.(path)}>
			<Icon code="folder-open" />
			{isMac ? t("open-in.finder") : t("open-in.explorer")}
		</DropdownMenuItem>
	);
};
