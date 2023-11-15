import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { ItemLink } from "../../../../extensions/navigation/NavigationLinks";
import LevNavDragTree from "../../../../extensions/navigation/catalog/drag/render/DragTree";
import Layout from "../../../../extensions/navigation/catalog/main/render/Layout";
import LevNavWatchTree from "../../../../extensions/navigation/catalog/watch/WatchTree";

const LeftNavigationContent = ({
	itemLinks,
	closeNavigation,
}: {
	itemLinks: ItemLink[];
	closeNavigation?: () => void;
}) => {
	const isOpen = LeftNavigationIsOpenService.value;

	return (
		<div style={isOpen ? null : { paddingRight: "31px" }}>
			<Layout
				wathChildren={<LevNavWatchTree items={itemLinks} closeNavigation={closeNavigation} />}
				dragChildren={<LevNavDragTree items={itemLinks} closeNavigation={closeNavigation} />}
				// dragChildren={<LevNavWatchTree items={itemLinks} />}
			/>
		</div>
	);
};

export default LeftNavigationContent;
