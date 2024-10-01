import styled from "@emotion/styled";
import LeftSidebar from "../../LeftSidebar/LeftSidebar";
import { classNames } from "@components/libs/classNames";
import { LEFT_NAV_CLASS } from "@app/config/const";

const LeftNavigationLayout = styled(
	({
		mediumMedia,
		leftNavigationTop,
		leftNavigationContent,
		leftNavigationBottom,
		hideScroll,
		isOpen,
		onMouseEnter,
		onMouseLeave,
		onTransitionEnd,
		className,
	}: {
		mediumMedia: boolean;
		leftNavigationContent: JSX.Element;
		leftNavigationTop: JSX.Element;
		leftNavigationBottom: JSX.Element;
		hideScroll?: boolean;
		transitionEndIsOpen: boolean;
		isOpen: boolean;
		isPin: boolean;
		onMouseEnter?: () => void;
		onMouseLeave?: () => void;
		onTransitionEnd?: () => void;
		className?: string;
	}) => {
		return (
			<div className={classNames(className, {}, [LEFT_NAV_CLASS])} onTransitionEnd={onTransitionEnd}>
				<LeftSidebar
					hideScroll={hideScroll}
					shadow={isOpen}
					sidebarTop={
						<div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onTouchEnd={onMouseEnter}>
							{leftNavigationTop}
						</div>
					}
					sidebarBottom={
						<div
							onMouseEnter={() => {
								if (!onMouseEnter) return;
								if (mediumMedia) {
									onMouseEnter();
									return;
								}
								if (isOpen) onMouseEnter();
							}}
							onMouseLeave={onMouseLeave}
							onTouchEnd={onMouseEnter}
						>
							{leftNavigationBottom}
						</div>
					}
					onContentMouseEnter={onMouseEnter}
					onContentMouseLeave={onMouseLeave}
				>
					{leftNavigationContent}
				</LeftSidebar>
			</div>
		);
	},
)`
	height: 100%;
	z-index: var(--z-index-nav-layout);
	position: absolute;
	width: var(--left-nav-width);
	background: var(--color-menu-bg);
	transition: var(--navigation-transition);

	${(p) =>
		p.isPin
			? `
	transform: translateX(0px);
	${p.transitionEndIsOpen ? "position: static;" : ""}
			`
			: `
	transform: translateX(calc((-1 * var(--left-nav-width) + 30px)));
			`}
	${(p) =>
		!p.isPin && p.isOpen
			? `
	transform: translateX(0);
	box-shadow: var(--shadows-deeplight);
			`
			: ``}

	@media print {
		display: none !important;
	}
`;

export default LeftNavigationLayout;
