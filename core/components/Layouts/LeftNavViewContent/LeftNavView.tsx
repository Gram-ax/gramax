import { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import LeftSidebar from "@components/Layouts/LeftSidebar/LeftSidebar";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";

interface LeftNavViewProps {
	elements: ViewContent[];
	currentIdx?: number;
	sideBarTop?: JSX.Element;
	sideBarBottom?: JSX.Element;
	elementClassName?: string;
	focusElementClassName?: string;
	onLeftSidebarClick?: (idx: number) => void;
	className?: string;
}

const LeftNavView = (props: LeftNavViewProps) => {
	const {
		elements,
		currentIdx = 0,
		sideBarTop,
		sideBarBottom,
		elementClassName = "log-entry",
		focusElementClassName = "log-entry active",
		onLeftSidebarClick,
		className,
	} = props;

	const getKey = (idx: number) => {
		return elements[idx]?.key ?? idx;
	};

	const getClassName = (idx: number) => {
		const clickable = elements[idx]?.clickable;
		if (clickable === false) return;
		return idx === currentIdx ? focusElementClassName : elementClassName;
	};

	return (
		<div className={classNames(className, {}, ["left-sidebar"])}>
			<LeftSidebar sidebarTop={sideBarTop} sidebarBottom={sideBarBottom}>
				<div className={"sidebar"}>
					<div className="sidebar-content hover-scrollbar">
						{elements.map((c, idx) => (
							<div
								className={getClassName(idx)}
								key={getKey(idx)}
								onClick={() => {
									if (c.clickable === false) return;
									onLeftSidebarClick?.(idx);
								}}
								data-qa="qa-clickable"
							>
								{c.leftSidebar}
							</div>
						))}
					</div>
				</div>
			</LeftSidebar>
		</div>
	);
};

export default styled(LeftNavView)`
	height: inherit;

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
