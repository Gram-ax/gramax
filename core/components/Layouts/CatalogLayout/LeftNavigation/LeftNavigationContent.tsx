import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import { LeftNavViewContentComponent } from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import LevNavDragTree from "../../../../extensions/navigation/catalog/drag/render/DragTree";
import Layout from "../../../../extensions/navigation/catalog/main/render/Layout";

const LeftNavigationContent: LeftNavViewContentComponent = ({ itemLinks, closeNavigation }) => {
	const isOpen = SidebarsIsOpenService.value.left;

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
