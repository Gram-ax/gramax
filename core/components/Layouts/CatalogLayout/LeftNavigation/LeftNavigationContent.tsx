import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import type { LeftNavViewContentComponent } from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import { NavigationTree } from "@ext/navigation/catalog/SidebarNavigation/components/edit/NavigationTree";
import { ReadonlyNavigationTree } from "@ext/navigation/catalog/SidebarNavigation/components/render/ReadonlyNavigationTree";
import Layout from "../../../../extensions/navigation/catalog/main/render/Layout";

const LeftNavigationContent: LeftNavViewContentComponent = ({ itemLinks, closeNavigation }) => {
	const isOpen = SidebarsIsOpenService.value.left;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	return (
		<div style={isOpen ? null : { paddingRight: "var(--left-navigation-content-padding-right)" }}>
			<Layout>
				{isReadOnly ? (
					<ReadonlyNavigationTree items={itemLinks} />
				) : (
					<NavigationTree closeNavigation={closeNavigation} items={itemLinks} />
				)}
			</Layout>
		</div>
	);
};

export default LeftNavigationContent;
