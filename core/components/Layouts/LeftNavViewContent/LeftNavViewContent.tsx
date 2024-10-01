import LeftNavView from "@components/Layouts/LeftNavViewContent/LeftNavView";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { Attributes, useRef, useState } from "react";

export type ViewContent = {
	leftSidebar: JSX.Element;
	content?: JSX.Element;
	clickable?: boolean;
} & Pick<Attributes, "key">;

const LeftNavViewContent = ({
	elements,
	sideBarTop,
	sideBarBottom,
	currentIdx,
	commonContent,
	elementClassName = "log-entry",
	focusElementClassName = "log-entry active",
	className,
	onLeftSidebarClick,
}: {
	elements: ViewContent[];
	sideBarTop?: JSX.Element;
	sideBarBottom?: JSX.Element;
	commonContent?: JSX.Element;
	elementClassName?: string;
	focusElementClassName?: string;
	currentIdx?: number;
	className?: string;
	onLeftSidebarClick?: (idx: number) => void;
}) => {
	const contentRef = useRef<HTMLDivElement>(null);
	const [currentElementIdx, setCurrentElementIdx] = useState(currentIdx ?? 0);

	useWatch(() => {
		if (typeof currentIdx !== "number") return;
		setCurrentElementIdx(currentIdx);
	}, [currentIdx]);

	const getKey = (idx: number) => {
		return elements[idx]?.key ?? idx;
	};

	if (elements.length == 0) return null;

	return (
		<div className={className} data-qa={`article-git-modal`}>
			<LeftNavView
				elements={elements}
				currentIdx={currentElementIdx}
				elementClassName={elementClassName}
				focusElementClassName={focusElementClassName}
				onLeftSidebarClick={(idx) => {
					if (typeof currentIdx !== "number") setCurrentElementIdx(idx);
					contentRef.current.scrollTo(0, 0);
					onLeftSidebarClick?.(idx);
				}}
				sideBarTop={sideBarTop}
				sideBarBottom={sideBarBottom}
			/>
			<div className="content" ref={contentRef} key={commonContent ? undefined : getKey(currentElementIdx)}>
				{commonContent ?? elements[currentElementIdx]?.content}
			</div>
		</div>
	);
};

export default styled(LeftNavViewContent)`
	width: 100%;
	height: 80vh;
	display: flex;
	position: relative;
	border-radius: var(--radius-x-large);
	color: var(--color-article-text);
	background: var(--color-article-bg);
	overflow: hidden;

	> .left-sidebar {
		height: 100%;
		width: var(--narrow-nav-width);
		background: var(--color-menu-bg);
	}

	.content {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}
`;
