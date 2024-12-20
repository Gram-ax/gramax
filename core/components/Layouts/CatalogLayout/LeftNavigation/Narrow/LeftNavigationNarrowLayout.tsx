import styled from "@emotion/styled";
import LeftSidebar from "../../../LeftSidebar/LeftSidebar";
import { classNames } from "@components/libs/classNames";
import { LEFT_NAV_CLASS } from "@app/config/const";

const LeftNavigationNarrowLayout = styled(
	({
		leftNavigationTop,
		leftNavigationContent,
		leftNavigationBottom,
		isOpen,
		className,
	}: {
		leftNavigationContent: JSX.Element;
		leftNavigationTop: JSX.Element;
		leftNavigationBottom: JSX.Element;
		className?: string;
		isOpen: boolean;
	}) => {
		return (
			<div className={classNames(className, {}, [LEFT_NAV_CLASS])}>
				<div className="header-navigation">{leftNavigationTop}</div>
				<div className="left-sidebar-content">
					<LeftSidebar shadow={isOpen} sidebarBottom={leftNavigationBottom}>
						{leftNavigationContent}
					</LeftSidebar>
				</div>
			</div>
		);
	},
)`
	width: 100%;

	&,
	.header-navigation,
	.left-sidebar-content {
		position: absolute;
	}

	.header-navigation {
		width: 100%;
		background: var(--color-nav-menu-bg);
		z-index: var(--z-index-header-navigation);
	}

	.left-sidebar-content {
		top: var(--top-bar-height);
		z-index: var(--z-index-nav-layout);
		height: calc(100dvh - var(--top-bar-height));
		width: var(--left-nav-width);
		background: var(--color-nav-menu-bg);
		transition: var(--navigation-transition);

		${(p) =>
			p.isOpen
				? `
		transform: translateX(0);
		box-shadow: var(--shadows-deeplight);
				`
				: `
		transform: translateX(calc(-1 * var(--left-nav-width)));`}
	}
`;

export default LeftNavigationNarrowLayout;
