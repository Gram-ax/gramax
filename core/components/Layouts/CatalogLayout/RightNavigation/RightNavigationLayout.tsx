import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";
import { ReactNode } from "react";

interface RightNavigationLayoutProps {
	rightNavigationContent: ReactNode;
	onRightNavMouseEnter?: () => void;
	onRightNavMouseLeave?: () => void;
	className?: string;
}

const RightNavigationLayout = (props: RightNavigationLayoutProps) => {
	const { rightNavigationContent, onRightNavMouseEnter, onRightNavMouseLeave, className } = props;
	return (
		<div
			className={className}
			onMouseEnter={onRightNavMouseEnter}
			onMouseLeave={onRightNavMouseLeave}
			onTouchEnd={onRightNavMouseEnter}
		>
			<div className="right-nav">{rightNavigationContent}</div>
		</div>
	);
};

export default styled(RightNavigationLayout)`
	height: 100%;
	width: var(--narrow-nav-width);
	background: var(--color-right-nav-bg);
	color: var(--color-primary-general);

	.right-nav {
		display: flex;
		flex-direction: column;
		padding: 20px 12px 20px 20px;
		overflow-y: scroll;
		height: 100%;
		${() => (useMediaQuery(cssMedia.narrow) ? "padding-top: calc(16px + var(--top-bar-height));" : "")}
	}

	@media print {
		display: none !important;
	}
`;
