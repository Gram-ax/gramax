import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import { LeftNavViewContentComponent } from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import LevNavWatchTree from "@ext/navigation/catalog/watch/WatchTree";
import LevNavDragTree from "../../../../extensions/navigation/catalog/drag/render/DragTree";
import Layout from "../../../../extensions/navigation/catalog/main/render/Layout";

const LeftNavigationContent: LeftNavViewContentComponent = ({ itemLinks, closeNavigation }) => {
	const isOpen = SidebarsIsOpenService.value.left;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const LevNav = isReadOnly ? LevNavWatchTree : LevNavDragTree;

	return (
		<div style={isOpen ? null : { paddingRight: "31px" }}>
			<Layout>
				<LevNav closeNavigation={closeNavigation} items={itemLinks} />
			</Layout>
		</div>
	);
};

export default LeftNavigationContent;
