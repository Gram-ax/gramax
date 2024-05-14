import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";

const LinkItemSidebar = (title: string, iconCode?: string) => (
	<div style={{ width: "100%", padding: "5px 10px" }}>
		<Sidebar title={title} leftActions={iconCode ? [<Icon key={0} code={iconCode} />] : undefined} />
	</div>
);

export default LinkItemSidebar