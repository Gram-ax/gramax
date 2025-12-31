import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";

export type LinkItemSidebarProps = {
	title: string;
	iconCode?: string;
};

const LinkItemSidebar = ({ iconCode, title }: LinkItemSidebarProps) => {
	return (
		<div style={{ width: "100%", padding: "5px 10px" }}>
			<Sidebar title={title} leftActions={iconCode && [<Icon key={0} code={iconCode} />]} />
		</div>
	);
};

export default LinkItemSidebar;
