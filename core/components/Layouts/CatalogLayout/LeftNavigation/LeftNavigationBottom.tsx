import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureCatalogPermission, editCatalogContentPermission } from "@ext/security/logic/Permission/Permissions";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageInitialized";
import { useMediaQuery } from "@mui/material";
import CreateArticle from "../../../../extensions/artilce/actions/CreateArticle";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import ExtensionBarLayout from "../../ExtensionBarLayout";
import ArticleStatusBar from "../../StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import PinToggleArrowIcon from "./PinToggleArrowIcon";

const LeftNavigationBottom = ({ data, closeNavigation }: { data: ArticlePageData; closeNavigation?: () => void }) => {
	const catalogProps = CatalogPropsService.value;
	const isCatalogExist = !!catalogProps.name;
	const leftNavIsOpen = SidebarsIsOpenService.value.left;
	const leftNavTrEndIsOpen = SidebarsIsOpenService.transitionEndIsLeftOpen;
	const mediumMedia = useMediaQuery(cssMedia.JSmedium);
	const isStorageInitialized = useIsStorageInitialized();
	const workspacePath = WorkspaceService.current().path;
	const { isNext } = usePlatform();

	const canEditContentCatalog = PermissionService.useCheckPermission(
		editCatalogContentPermission,
		workspacePath,
		catalogProps.name,
	);
	const canConfigureCatalog = PermissionService.useCheckPermission(
		configureCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	const canSeeStatusBar =
		(isNext && canConfigureCatalog) || (!isNext && (canEditContentCatalog || !catalogProps.sourceName));

	const getPaddingTop = (): string => {
		if (leftNavIsOpen) return "0";
		if (!leftNavIsOpen && leftNavTrEndIsOpen) return "0";
		if (!leftNavIsOpen && !leftNavTrEndIsOpen) return "70px";
	};

	const getHeight = (): number => {
		if (leftNavIsOpen) return 34;
		if (!leftNavIsOpen && leftNavTrEndIsOpen) return 34;
		if (!leftNavIsOpen && !leftNavTrEndIsOpen) return 34 + 70;
	};

	return (
		<div data-qa="qa-status-bar">
			<ExtensionBarLayout
				height={getHeight()}
				padding={{
					top: getPaddingTop(),
					left: leftNavIsOpen ? "14px" : "0",
					right: leftNavIsOpen ? "14px" : "6px",
				}}
				leftExtensions={
					isCatalogExist ? [<CreateArticle root={data.rootRef} key={0} onCreate={closeNavigation} />] : null
				}
				rightExtensions={mediumMedia ? null : [<PinToggleArrowIcon key={0} />]}
			/>
			{canSeeStatusBar && isCatalogExist && (
				<ArticleStatusBar
					isStorageInitialized={isStorageInitialized}
					padding={leftNavIsOpen ? "0 6px" : "0 31px"}
				/>
			)}
		</div>
	);
};
export default LeftNavigationBottom;
