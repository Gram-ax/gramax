import RightNavigation from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigation";
import RightNavigationLayout from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigationLayout";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useEffect, useRef } from "react";

interface RightNavigationComponentProps {
	delay?: number;
}

const RightNavigationComponent = (props: RightNavigationComponentProps) => {
	const { delay } = props;

	const prevIsSidebarRightPin = useRef<boolean>(null);
	const { right: isSidebarRightPin } = SidebarsIsPinService.value;

	const isRightNavHover = useRef(false);

	// React Warning with useWatch: Cannot update a component (`bound Init`) while rendering a different component.
	// To locate the bad setState() call inside
	useEffect(() => {
		if (prevIsSidebarRightPin.current && !isSidebarRightPin) {
			SidebarsIsOpenService.value = { right: false };
		}
		prevIsSidebarRightPin.current = isSidebarRightPin;
	}, [isSidebarRightPin]);

	const onRightNavMouseEnterHandler = () => {
		isRightNavHover.current = true;
		setTimeout(() => {
			if (isRightNavHover.current && !isSidebarRightPin) {
				SidebarsIsOpenService.value = { right: true };
			}
		}, delay);
	};

	const onRightNavMouseLeaveHandler = () => {
		isRightNavHover.current = false;
	};

	return (
		<RightNavigationLayout
			rightNavigationContent={<RightNavigation />}
			onPointerUp={onRightNavMouseEnterHandler}
			onPointerLeave={onRightNavMouseLeaveHandler}
			onTouchEnd={onRightNavMouseEnterHandler}
		/>
	);
};

export default RightNavigationComponent;
