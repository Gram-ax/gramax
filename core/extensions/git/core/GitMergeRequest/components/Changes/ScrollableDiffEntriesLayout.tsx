import LeftSidebar from "@components/Layouts/LeftSidebar/LeftSidebar";
import { forwardRef, type RefObject } from "react";

interface ScrollableDiffEntriesLayoutProps {
	children: JSX.Element;
	maxHeight?: string;
}
const ScrollableDiffEntriesLayout = forwardRef(
	(props: ScrollableDiffEntriesLayoutProps, ref: RefObject<HTMLDivElement>) => {
		const { children, maxHeight = "50vh" } = props;
		return (
			<LeftSidebar
				boxShadowStyles={{
					top: "0px 6px 5px 0px var(--color-diff-entries-shadow) inset",
					bottom: "0px -6px 5px 0px var(--color-diff-entries-shadow) inset",
				}}
				ref={ref}
				style={{ height: "auto" }}
			>
				<div style={{ maxHeight }}>{children}</div>
			</LeftSidebar>
		);
	},
);

export default ScrollableDiffEntriesLayout;
