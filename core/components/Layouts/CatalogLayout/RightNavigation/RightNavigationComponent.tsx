import RightNavigation from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigation";
import RightNavigationLayout from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigationLayout";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import useWatch from "@core-ui/hooks/useWatch";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { useRef } from "react";

interface RightNavigationComponentProps {
	itemLinks: ItemLink[];
	delay?: number;
}

const RightNavigationComponent = (props: RightNavigationComponentProps) => {
	const { itemLinks, delay } = props;

	const prevIsSidebarRightPin = useRef<boolean>(null);
	const isSidebarRightPin = SidebarsIsPinService.value.right;

	const isRightNavHover = useRef(false);

	useWatch(() => {
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
			rightNavigationContent={<RightNavigation itemLinks={itemLinks} />}
			onRightNavMouseEnter={onRightNavMouseEnterHandler}
			onRightNavMouseLeave={onRightNavMouseLeaveHandler}
		/>
	);
};

export default RightNavigationComponent;
