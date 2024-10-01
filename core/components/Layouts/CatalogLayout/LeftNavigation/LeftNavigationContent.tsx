import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { LeftNavViewContentComponent } from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import LevNavDragTree from "../../../../extensions/navigation/catalog/drag/render/DragTree";
import Layout from "../../../../extensions/navigation/catalog/main/render/Layout";

const LeftNavigationContent: LeftNavViewContentComponent = ({ itemLinks, closeNavigation }) => {
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
