import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@react-hook/media-query";
import { ReactNode } from "react";

interface RightNavigationLayoutProps {
	rightNavigationContent: ReactNode;
	onPointerUp?: () => void;
	onPointerLeave?: () => void;
	onTouchEnd?: () => void;
	className?: string;
}

const RightNavigationLayout = (props: RightNavigationLayoutProps) => {
	const { rightNavigationContent, ...otherProps } = props;
	return (
		<div {...otherProps}>
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
		padding: 2rem 1.2rem 2rem 2rem;
		overflow-y: scroll;
		height: 100%;
		${() => (useMediaQuery(cssMedia.narrow) ? "padding-top: calc(1rem + var(--top-bar-height));" : "")}
	}

	@media print {
		display: none !important;
	}
`;
