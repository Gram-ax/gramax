import RightNavigationComponent from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigationComponent";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { useMediaQuery } from "@mui/material";
import ArticleComponent from "./ArticleLayout/ArticleComponent";
import CatalogLayout from "./CatalogLayout";
import LeftNavigationComponent from "./LeftNavigation/LeftNavigationComponent";
import LeftNavigationNarrowComponent from "./LeftNavigation/Narrow/LeftNavigationNarrowComponent";
import DocRootMissingModal from "@components/Layouts/CatalogLayout/DocRootMissingModal";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ComponentProps, useEffect } from "react";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";

const OPEN_DELAY_MS = 50;

const CatalogComponent = ({ data, children }: { data: ArticlePageData; children: JSX.Element }) => {
	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const mediumMedia = useMediaQuery(cssMedia.JSmedium);
	const pageDataContext = PageDataContextService.value;
	const isReadOnly = pageDataContext.conf.isReadOnly;

	useEffect(() => {
		if (isReadOnly || !data.catalogProps.docrootIsNoneExsistent) return;
		ModalToOpenService.setValue<ComponentProps<typeof DocRootMissingModal>>(ModalToOpen.DocRootMissingModal, {
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, []);

	return (
		<SidebarsIsOpenService.Provider>
			<CatalogLayout
				catalogNav={
					narrowMedia ? (
						<LeftNavigationNarrowComponent data={data} />
					) : (
						<LeftNavigationComponent data={data} mediumMedia={mediumMedia} delay={OPEN_DELAY_MS} />
					)
				}
				article={
					<ArticleComponent
						article={children}
						rightNav={<RightNavigationComponent delay={OPEN_DELAY_MS} />}
					/>
				}
			/>
		</SidebarsIsOpenService.Provider>
	);
};

export default CatalogComponent;
