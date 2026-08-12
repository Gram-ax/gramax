import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import LeftNavViewContentContainer from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContainer";
import { useItemLinks } from "@core-ui/stores/ItemLinksStore/ItemLinksStore.provider";
import { useCallback } from "react";
import LeftNavigationBottom from "../LeftNavigationBottom";
import LeftNavigationTop from "../LeftNavigationTop";
import LeftNavigationNarrowLayout from "./LeftNavigationNarrowLayout";

const LeftNavigationNarrowComponent = ({ data }: { data: ArticlePageData }) => {
	const closeNavigation = useCallback(() => {
		SidebarsIsOpenService.value = { left: false };
	}, []);
	const itemLinks = useItemLinks();

	return (
		<LeftNavigationNarrowLayout
			isOpen={SidebarsIsOpenService.value.left}
			leftNavigationBottom={<LeftNavigationBottom closeNavigation={closeNavigation} data={data} />}
			leftNavigationContent={
				<LeftNavViewContentContainer closeNavigation={closeNavigation} itemLinks={itemLinks} />
			}
			leftNavigationTop={<LeftNavigationTop />}
		/>
	);
};

export default LeftNavigationNarrowComponent;
