import ShowInExplorer from "@components/Actions/ShowInExplorer";
import useShouldRenderDeleteCatalog from "@components/Actions/useShouldRenderDeleteCatalog";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import AddToFavoriteButton from "@ext/article/Favorite/components/AddToFavoriteButton";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import CatalogExport from "@ext/catalog/actions/propsEditor/components/CatalogExport";
import CatalogPropsTrigger from "@ext/catalog/actions/propsEditor/components/CatalogPropsTrigger";
import CatalogTools from "@ext/catalog/actions/propsEditor/components/CatalogTools";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import HealthcheckTrigger from "@ext/healthcheck/components/HealthcheckTrigger";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { configureCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import openCloudModal from "@ext/static/components/openCloudModal";
import useValidateDeleteCatalogInStatic from "@ext/static/logic/useValidateDeleteCatalogInStatic";
import { feature } from "@ext/toggleFeatures/features";
import { Button } from "@ui-kit/Button";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { FC, useEffect, useState } from "react";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";

interface CatalogActionsProps {
	isCatalogExist: boolean;
	itemLinks: ItemLink[];
	currentTab: LeftNavigationTab;
	setCurrentTab: (tab: LeftNavigationTab) => void;
}

const CatalogActions: FC<CatalogActionsProps> = ({ isCatalogExist, itemLinks, currentTab, setCurrentTab }) => {
	const { catalogName, sourceName, pathName } = useCatalogPropsStore(
		(state) => ({
			catalogName: state.data.name,
			sourceName: state.data.sourceName,
			pathName: state.data?.link?.pathname,
		}),
		"shallow",
	);
	const workspacePath = WorkspaceService.current()?.path;
	const pageData = PageDataContextService.value;
	const { isNext, isTauri, isStatic, isStaticCli } = usePlatform();
	const isMac = IsMacService.value;
	const shouldRenderDeleteCatalog = useShouldRenderDeleteCatalog();
	const [renderDeleteCatalog, setRenderDeleteCatalog] = useState(false);
	const { isReadOnly, cloudServiceUrl } = pageData.conf;
	const isArticleExist = !!itemLinks.length;
	const isAiEnabled = pageData.conf.ai.enabled;
	const validateDeleteCatalogInStatic = useValidateDeleteCatalogInStatic();
	const { catalogs } = FavoriteService.value;

	const canConfigureCatalog = PermissionService.useCheckPermission(configureCatalogPermission, workspacePath, catalogName);

	useEffect(() => {
		setRenderDeleteCatalog(shouldRenderDeleteCatalog);
	}, []);

	if (!isCatalogExist) return null;

	const onClickFavorite = () => {
		const newFavoriteCatalogs = catalogs.find((catalog) => catalog === catalogName)
			? catalogs.filter((catalog) => catalog !== catalogName)
			: [...catalogs, catalogName];

		FavoriteService.setCatalogs(newFavoriteCatalogs);
	};

	const onOpen = async () => {
		if (!shouldRenderDeleteCatalog || !isStatic) return;
		setRenderDeleteCatalog(await validateDeleteCatalogInStatic());
	};

	const toggleCurrentTab = (tab: LeftNavigationTab) => {
		setCurrentTab(tab === currentTab ? LeftNavigationTab.None : tab);
	};

	return (
		<NavigationDropdown
			onOpen={onOpen}
			dataQa="qa-catalog-actions"
			style={{ marginRight: "-4px" }}
			trigger={
				<Button variant="text" size="xs" className="p-0 h-full">
					<Icon code="ellipsis-vertical" style={{ fontSize: "1.7em" }} />
				</Button>
			}
		>
			{canConfigureCatalog && !isReadOnly && <CatalogPropsTrigger />}
			{/* {canConfigureCatalog && isNext && <SharedTicketTrigger />} */}
			{!isNext && sourceName && <ShareAction path={`/${pathName}`} isArticle={false} />}
			{isTauri && <ShowInExplorer />}
			<CatalogExport name={catalogName} disabled={!isArticleExist} />

			{!(isMac && isTauri) && cloudServiceUrl && feature("cloud") && (
				<DropdownMenuItem onSelect={openCloudModal}>
					<Icon code="cloud-upload" />
					{t("cloud.publish-to-cloud")}
				</DropdownMenuItem>
			)}
			{!isStaticCli && !isStatic && (
				<>
					<AddToFavoriteButton
						isFavorite={!!catalogs.find((catalog) => catalog === catalogName)}
						onClick={onClickFavorite}
					/>
					<DropdownMenuItem onSelect={() => toggleCurrentTab(LeftNavigationTab.FavoriteArticles)}>
						<Icon code="star" />
						{t("favorites-articles")}
					</DropdownMenuItem>
				</>
			)}
			<IsReadOnlyHOC>
				<CatalogTools toggleTab={toggleCurrentTab} isAiEnabled={isAiEnabled} />
				<HealthcheckTrigger itemLinks={itemLinks} />
			</IsReadOnlyHOC>
			{renderDeleteCatalog && <DeleteCatalog />}
		</NavigationDropdown>
	);
};

export default CatalogActions;
