import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { ItemLink } from "../../../../extensions/navigation/NavigationLinks";
import LevNavDragTree from "../../../../extensions/navigation/catalog/drag/render/DragTree";
import Layout from "../../../../extensions/navigation/catalog/main/render/Layout";

const LeftNavigationContent = ({
	itemLinks,
	closeNavigation,
}: {
	itemLinks: NodeModel<ItemLink>[];
	closeNavigation?: () => void;
}) => {
	const isOpen = LeftNavigationIsOpenService.value;

	return (
		<div style={isOpen ? null : { paddingRight: "31px" }}>
			<Layout>
				{/* <LevNavWatchTree items={itemLinks} closeNavigation={closeNavigation} /> */}
				<LevNavDragTree items={itemLinks} closeNavigation={closeNavigation} />
			</Layout>
		</div>
	);
};

export default LeftNavigationContent;
