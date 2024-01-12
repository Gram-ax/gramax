import { useEffect, useRef, useState } from "react";

import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import { ArticleData } from "../../../../logic/SitePresenter/SitePresenter";
import LeftNavigationBottom from "./LeftNavigationBottom";
import LeftNavigationContent from "./LeftNavigationContent";
import LeftNavigationLayout from "./LeftNavigationLayout";
import LeftNavigationTop from "./LeftNavigationTop";

const LeftNavigationComponent = ({ data, delay }: { data: ArticleData; delay?: number }) => {
	const [hideScroll, setHideScroll] = useState(true);
	const isPin = SidebarsIsPinService.value;
	const isOpen = LeftNavigationIsOpenService.value;
	const isLeftNavHover = useRef(false);

	useEffect(() => {
		if (!isPin) LeftNavigationIsOpenService.value = false;
	}, [isPin]);

	useEffect(() => {
		if (!isOpen) setHideScroll(true);
	}, [isOpen]);

	return (
		<div
			style={{ width: "fit-content" }}
			onMouseEnter={() => (isLeftNavHover.current = true)}
			onMouseLeave={() => (isLeftNavHover.current = false)}
		>
			<LeftNavigationLayout
				hideScroll={hideScroll}
				leftNavigationTop={<LeftNavigationTop data={data} />}
				leftNavigationContent={<LeftNavigationContent itemLinks={data.itemLinks} />}
				leftNavigationBottom={<LeftNavigationBottom />}
				onMouseEnter={() =>
					setTimeout(() => {
						if (isLeftNavHover.current) {
							LeftNavigationIsOpenService.value = true;
							setHideScroll(false);
						}
					}, delay)
				}
				onTransitionEnd={() => (LeftNavigationIsOpenService.transitionEndIsOpen = isOpen)}
				transitionEndIsOpen={LeftNavigationIsOpenService.transitionEndIsOpen}
				isOpen={isOpen}
				isPin={isPin}
			/>
		</div>
	);
};

export default LeftNavigationComponent;
