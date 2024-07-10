import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { cssMedia } from "@core-ui/utils/cssUtils";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageIniziliate";
import { useMediaQuery } from "@mui/material";
import CreateArticle from "../../../../extensions/artilce/actions/CreateArticle";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import PageDataContextService from "../../../../ui-logic/ContextServices/PageDataContext";
import ExtensionBarLayout from "../../ExtensionBarLayout";
import ArticleStatusBar from "../../StatusBar/Extensions/ArticleStatusBar";
import PinToggleArrowIcon from "./PinToggleArrowIcon";

const LeftNavigationBottom = ({ closeNavigation }: { closeNavigation?: () => void }) => {
	const catalogProps = CatalogPropsService.value;
	const readOnlyCatalog = catalogProps.readOnly;
	const isCatalogExist = !!catalogProps.name;
	const isLogged = PageDataContextService.value.isLogged;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const neededToBeLogged = (isLogged && isReadOnly) || !isReadOnly;
	const leftNavIsOpen = LeftNavigationIsOpenService.value;
	const leftNavTrEndIsOpen = LeftNavigationIsOpenService.transitionEndIsOpen;
	const mediumMedia = useMediaQuery(cssMedia.JSmedium);
	const isStorageInitialized = useIsStorageInitialized();

	const getPaddingTop = (): string => {
		if (leftNavIsOpen) return "0";
		if (!leftNavIsOpen && leftNavTrEndIsOpen) return "0";
		if (!leftNavIsOpen && !leftNavTrEndIsOpen) return "70px";
	};

	const getHeight = (): number => {
		if (leftNavIsOpen) return 42;
		if (!leftNavIsOpen && leftNavTrEndIsOpen) return 42;
		if (!leftNavIsOpen && !leftNavTrEndIsOpen) return 42 + 70;
	};

	return (
		<div data-qa="qa-status-bar">
			<ExtensionBarLayout
				height={getHeight()}
				padding={{
					top: getPaddingTop(),
					left: leftNavIsOpen ? "20px" : "0",
					right: leftNavIsOpen ? "20px" : "6px",
				}}
				leftExtensions={isCatalogExist ? [<CreateArticle key={0} onCreate={closeNavigation} />] : null}
				rightExtensions={mediumMedia ? null : [<PinToggleArrowIcon key={0} />]}
			/>
			{!readOnlyCatalog && neededToBeLogged && isCatalogExist && (
				<ArticleStatusBar
					isStorageInitialized={isStorageInitialized}
					padding={leftNavIsOpen ? "0 6px" : "0 31px"}
				/>
			)}
		</div>
	);
};
export default LeftNavigationBottom;
