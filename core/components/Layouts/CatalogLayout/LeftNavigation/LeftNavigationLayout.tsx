import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";
import LeftSidebar from "../../LeftSidebar/LeftSidebar";

const LeftNavigationLayout = styled(
	({
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
		const mediumMedia = useMediaQuery(cssMedia.JSmedium);

		return (
			<div className={className + " left-navigation-layout"} onTransitionEnd={onTransitionEnd}>
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
	width: var(--left-nav-width);
	background: var(--color-menu-bg);
	z-index: 102;
	position: absolute;
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
