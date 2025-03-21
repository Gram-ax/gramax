import LeftSidebar from "@components/Layouts/LeftSidebar/LeftSidebar";

interface ScrollableDiffEntriesLayoutProps {
	children: JSX.Element;
	maxHeight?: string;
}
const ScrollableDiffEntriesLayout = (props: ScrollableDiffEntriesLayoutProps) => {
	const { children, maxHeight = "50vh" } = props;
	return (
		<LeftSidebar
			style={{ height: "auto" }}
			boxShadowStyles={{
				top: "0px 6px 5px 0px var(--color-diff-entries-shadow) inset",
				bottom: "0px -6px 5px 0px var(--color-diff-entries-shadow) inset",
			}}
		>
			<div style={{ maxHeight }}>{children}</div>
		</LeftSidebar>
	);
};

export default ScrollableDiffEntriesLayout;
