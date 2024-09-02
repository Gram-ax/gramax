import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import { useRef, useState } from "react";
import { ArticlePageData } from "../../../../logic/SitePresenter/SitePresenter";
import LeftNavigationBottom from "./LeftNavigationBottom";
import LeftNavigationContent from "./LeftNavigationContent";
import LeftNavigationLayout from "./LeftNavigationLayout";
import LeftNavigationTop from "./LeftNavigationTop";

const LeftNavigationComponent = ({
	data,
	mediumMedia,
	delay,
}: {
	data: ArticlePageData;
	mediumMedia: boolean;
	delay?: number;
}) => {
	const [hideScroll, setHideScroll] = useState(true);

	const isPin = SidebarsIsPinService.value;
	const [prevIsPin, setPrevIsPin] = useState<boolean>(undefined);

	const isOpen = LeftNavigationIsOpenService.value;
	const [prevIsOpen, setPrevIsOpen] = useState<boolean>(undefined);

	const transitionEndIsOpen = LeftNavigationIsOpenService.transitionEndIsOpen;

	const isLeftNavHover = useRef(false);
	const unpinAnimation = useRef(false);

	if (prevIsPin !== isPin) {
		if (prevIsPin && !isPin) {
			LeftNavigationIsOpenService.value = false;
			unpinAnimation.current = true;
		}
		setPrevIsPin(isPin);
	}

	if (prevIsOpen !== isOpen) {
		setPrevIsOpen(isOpen);
		if (!isOpen) setHideScroll(true);
	}

	return (
		<div
			style={{ width: "fit-content" }}
			onMouseEnter={() => (isLeftNavHover.current = true)}
			onMouseLeave={() => (isLeftNavHover.current = false)}
		>
			<LeftNavigationLayout
				mediumMedia={mediumMedia}
				hideScroll={hideScroll}
				leftNavigationTop={<LeftNavigationTop data={data} />}
				leftNavigationContent={<LeftNavigationContent itemLinks={data.leftNavItemLinks} />}
				leftNavigationBottom={<LeftNavigationBottom data={data} />}
				onMouseEnter={() =>
					setTimeout(() => {
						if (!isLeftNavHover.current || unpinAnimation.current) return;
						LeftNavigationIsOpenService.value = true;
						setHideScroll(false);
					}, delay)
				}
				onTransitionEnd={() => {
					LeftNavigationIsOpenService.transitionEndIsOpen = isOpen;
					unpinAnimation.current = false;
				}}
				transitionEndIsOpen={transitionEndIsOpen}
				isOpen={isOpen}
				isPin={isPin}
			/>
		</div>
	);
};

export default LeftNavigationComponent;
