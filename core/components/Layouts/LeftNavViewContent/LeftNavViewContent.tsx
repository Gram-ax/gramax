import LeftNavView from "@components/Layouts/LeftNavViewContent/LeftNavView";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { type Attributes, useCallback, useRef, useState } from "react";

export type ViewContent = {
	leftSidebar: JSX.Element;
	content?: JSX.Element;
	clickable?: boolean;
} & Pick<Attributes, "key">;

interface LeftNavViewContentProps {
	elements: ViewContent[];
	sideBarTop?: JSX.Element;
	sideBarBottom?: JSX.Element;
	commonContent?: JSX.Element;
	elementClassName?: string;
	focusElementClassName?: string;
	currentIdx?: number;
	className?: string;
	loadMoreTrigger?: JSX.Element;
	onLeftSidebarClick?: (idx: number) => void;
}

const LeftNavViewContent = (props: LeftNavViewContentProps) => {
	const {
		elements,
		sideBarTop,
		sideBarBottom,
		currentIdx,
		commonContent,
		elementClassName = "log-entry",
		focusElementClassName = "log-entry active",
		className,
		loadMoreTrigger,
		onLeftSidebarClick: onLeftSidebarClickProp,
	} = props;
	const contentRef = useRef<HTMLDivElement>(null);
	const [currentElementIdx, setCurrentElementIdx] = useState(currentIdx ?? 0);

	useWatch(() => {
		if (typeof currentIdx !== "number") return;
		setCurrentElementIdx(currentIdx);
	}, [currentIdx]);

	const getKey = useCallback(
		(idx: number) => {
			return elements[idx]?.key ?? idx;
		},
		[elements],
	);

	const onLeftSidebarClick = useCallback(
		(idx: number) => {
			if (typeof currentIdx !== "number") setCurrentElementIdx(idx);
			contentRef.current.scrollTo(0, 0);
			onLeftSidebarClickProp?.(idx);
		},
		[currentIdx, onLeftSidebarClickProp],
	);

	if (!elements.length) return null;

	return (
		<div className={className} data-qa={`article-git-modal`}>
			<LeftNavView
				currentIdx={currentElementIdx}
				elementClassName={elementClassName}
				elements={elements}
				focusElementClassName={focusElementClassName}
				loadMoreTrigger={loadMoreTrigger}
				onLeftSidebarClick={onLeftSidebarClick}
				sideBarBottom={sideBarBottom}
				sideBarTop={sideBarTop}
			/>
			<div className="content" key={commonContent ? undefined : getKey(currentElementIdx)} ref={contentRef}>
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
		background: var(--color-nav-menu-bg);
	}

	.content {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}
`;
