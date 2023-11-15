import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import LeftSidebar from "../LeftSidebar/LeftSidebar";

export type ViewContent = {
	leftSidebar: JSX.Element;
	content?: JSX.Element;
	clickable?: boolean;
};

const LeftNavViewContent = styled(
	({
		elements,
		sideBarTop,
		sideBarBottom,
		currentIdx = 0,
		elementClassName = "log-entry",
		focusElementClassName = "log-entry active",
		className,
	}: {
		elements: ViewContent[];
		sideBarTop?: JSX.Element;
		sideBarBottom?: JSX.Element;
		elementClassName?: string;
		focusElementClassName?: string;
		currentIdx?: number;
		className?: string;
	}) => {
		const contentRef = useRef<HTMLDivElement>(null);
		const [currentElementIdx, setCurrentElementIdx] = useState(currentIdx);

		useEffect(() => {
			if (!elements[currentElementIdx]) setCurrentElementIdx(elements.length - 1);
		}, [currentElementIdx, elements.length]);

		if (elements.length == 0) return null;
		return (
			<div className={className} data-qa={`article-history-modal`}>
				<div className="left-sidebar">
					<LeftSidebar sidebarTop={sideBarTop} sidebarBottom={sideBarBottom}>
						<div className={"sidebar"}>
							<div className="sidebar-content hover-scrollbar">
								{elements.map((c, idx) => (
									<div
										className={
											c.clickable === false
												? null
												: idx == currentElementIdx
												? focusElementClassName
												: elementClassName
										}
										key={idx}
										onClick={() => {
											if (c.clickable === false) return;
											setCurrentElementIdx(idx);
											contentRef.current.scrollTo(0, 0);
										}}
									>
										{c.leftSidebar}
									</div>
								))}
							</div>
						</div>
					</LeftSidebar>
				</div>
				<div className="content" ref={contentRef}>
					{elements[currentElementIdx]?.content}
				</div>
			</div>
		);
	},
)`
	width: 100%;
	height: 80vh;
	display: flex;
	position: relative;
	border-radius: var(--radius-block);
	color: var(--color-article-text);
	background: var(--color-article-bg);

	> .left-sidebar {
		height: 100%;
		border-radius: var(--radius-block);
		width: var(--narrow-nav-width);
		background: var(--color-menu-bg);
	}

	.content {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.log-entry {
		cursor: pointer;
		color: var(--color-primary-general);
	}

	.log-entry:hover {
		background: var(--color-lev-sidebar-hover);
	}

	.log-entry.active {
		background: var(--color-article-bg);
	}
`;

export default LeftNavViewContent;
