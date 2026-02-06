import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import LeftNavViewContentContainer from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContainer";
import { useCallback } from "react";
import { ArticlePageData } from "../../../../../logic/SitePresenter/SitePresenter";
import LeftNavigationBottom from "../LeftNavigationBottom";
import LeftNavigationTop from "../LeftNavigationTop";
import LeftNavigationNarrowLayout from "./LeftNavigationNarrowLayout";

const LeftNavigationNarrowComponent = ({ data }: { data: ArticlePageData }) => {
	const closeNavigation = useCallback(() => (SidebarsIsOpenService.value = { left: false }), []);

	return (
		<LeftNavigationNarrowLayout
			isOpen={SidebarsIsOpenService.value.left}
			leftNavigationBottom={<LeftNavigationBottom closeNavigation={closeNavigation} data={data} />}
			leftNavigationContent={
				<LeftNavViewContentContainer closeNavigation={closeNavigation} itemLinks={data.itemLinks} />
			}
			leftNavigationTop={<LeftNavigationTop data={data} />}
		/>
	);
};

export default LeftNavigationNarrowComponent;
