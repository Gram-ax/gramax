import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import CreateArticle from "@ext/article/actions/CreateArticle";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureCatalogPermission, editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { useMediaQuery } from "@react-hook/media-query";
import ExtensionBarLayout from "../../ExtensionBarLayout";
import ArticleStatusBar from "../../StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import PinToggleArrowIcon from "./PinToggleArrowIcon";

const LeftNavigationBottom = ({ data, closeNavigation }: { data: ArticlePageData; closeNavigation?: () => void }) => {
	const { catalogName, sourceName } = useCatalogPropsStore(
		(state) => ({ catalogName: state.data?.name, sourceName: state.data?.sourceName }),
		"shallow",
	);
	const isCatalogExist = !!catalogName;
	const leftNavIsOpen = SidebarsIsOpenService.value.left;
	const mediumMedia = useMediaQuery(cssMedia.JSmedium);
	const workspacePath = WorkspaceService.current().path;
	const { isNext, isStatic, isStaticCli } = usePlatform();
	const isStaticOrStaticCli = isStatic || isStaticCli;

	const canConfigureCatalog = PermissionService.useCheckPermission(configureCatalogPermission, workspacePath);
	const canReadContentCatalog = PermissionService.useCheckPermission(
		editCatalogPermission,
		workspacePath,
		catalogName,
	);
	const canSeeStatusBar =
		!isStaticOrStaticCli &&
		((isNext && canConfigureCatalog) || (!isNext && (canReadContentCatalog || !sourceName)));

	return (
		<div data-qa="qa-status-bar">
			<ExtensionBarLayout
				height={34}
				padding={{
					left: leftNavIsOpen ? "14px" : "0",
					right: leftNavIsOpen ? "14px" : "6px",
					bottom: "0px",
				}}
				leftExtensions={
					isCatalogExist ? [<CreateArticle root={data.rootRef} key={0} onCreate={closeNavigation} />] : null
				}
				rightExtensions={mediumMedia ? null : [<PinToggleArrowIcon key={1} />]}
			/>
			{canSeeStatusBar && isCatalogExist && <ArticleStatusBar padding={"0 6px"} />}
		</div>
	);
};
export default LeftNavigationBottom;
