import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";
import LinkItem from "@ext/artilce/LinkCreator/models/LinkItem";
import HeadingLinkItem from "./HeadingLinkItem";

type LinkItemSidebarProps = {
	title: string;
	iconCode?: string;
	item?: LinkItem;
};

const LinkItemSidebar = ({ item, iconCode, title }: LinkItemSidebarProps) => {
	if (item) return <HeadingLinkItem title={title} item={item} iconCode={iconCode} />;

	return (
		<div style={{ width: "100%", padding: "5px 10px" }}>
			<Sidebar title={title} leftActions={iconCode && [<Icon key={0} code={iconCode} />]} />
		</div>
	);
};

export default LinkItemSidebar;
