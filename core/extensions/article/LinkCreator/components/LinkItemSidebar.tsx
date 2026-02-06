import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";

export type LinkItemSidebarProps = {
	title: string;
	iconCode?: string;
};

const LinkItemSidebar = ({ iconCode, title }: LinkItemSidebarProps) => {
	return (
		<div style={{ width: "100%", padding: "5px 10px" }}>
			<Sidebar leftActions={iconCode && [<Icon code={iconCode} key={0} />]} title={title} />
		</div>
	);
};

export default LinkItemSidebar;
