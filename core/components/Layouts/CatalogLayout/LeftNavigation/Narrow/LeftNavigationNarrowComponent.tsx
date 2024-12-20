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
			leftNavigationTop={<LeftNavigationTop data={data} />}
			leftNavigationContent={
				<LeftNavViewContentContainer itemLinks={data.leftNavItemLinks} closeNavigation={closeNavigation} />
			}
			leftNavigationBottom={<LeftNavigationBottom data={data} closeNavigation={closeNavigation} />}
		/>
	);
};

export default LeftNavigationNarrowComponent;
