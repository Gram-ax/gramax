import resolveFrontendModule from "@app/resolveModule/frontend";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import Path from "@core/FileProvider/Path/Path";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import IsMacService from "@core-ui/ContextServices/IsMac";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import type { ItemLink } from "@ext/navigation/NavigationLinks";

interface ShowInExplorerProps {
	item?: ClientArticleProps | ItemLink;
	children?: React.ReactNode;
}

const ShowInExplorer = ({ item, children }: ShowInExplorerProps) => {
	const { isTauri } = usePlatform();
	if (!isTauri) return null;

	const isMac = IsMacService.value;
	const workspace = WorkspaceService.current();

	const catalogName = useCatalogPropsStore((state) => state.data.name);

	if (!workspace) return null;

	const path = item
		? new Path(workspace.path).join(new Path(item.ref.path)).parentDirectoryPath.value
		: new Path(workspace.path).join(new Path(catalogName)).value;

	return (
		<CatalogItem
			renderLabel={(Component) => (
				<Component onSelect={() => resolveFrontendModule("openInExplorer")?.(path)}>
					<Icon code="folder-open" />
					{isMac ? t("open-in.finder") : t("open-in.explorer")}
				</Component>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default ShowInExplorer;
