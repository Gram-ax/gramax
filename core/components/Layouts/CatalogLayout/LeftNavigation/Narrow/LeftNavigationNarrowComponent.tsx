import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { useCallback } from "react";
import { ArticlePageData } from "../../../../../logic/SitePresenter/SitePresenter";
import LeftNavigationBottom from "../LeftNavigationBottom";
import LeftNavigationContent from "../LeftNavigationContent";
import LeftNavigationTop from "../LeftNavigationTop";
import LeftNavigationNarrowLayout from "./LeftNavigationNarrowLayout";

const LeftNavigationNarrowComponent = ({ data }: { data: ArticlePageData }) => {
	const closeNavigation = useCallback(() => (LeftNavigationIsOpenService.value = false), []);

	return (
		<LeftNavigationNarrowLayout
			isOpen={LeftNavigationIsOpenService.value}
			leftNavigationTop={<LeftNavigationTop data={data} />}
			leftNavigationContent={
				<LeftNavigationContent itemLinks={data.leftNavItemLinks} closeNavigation={closeNavigation} />
			}
			leftNavigationBottom={<LeftNavigationBottom data={data} closeNavigation={closeNavigation} />}
		/>
	);
};

export default LeftNavigationNarrowComponent;
