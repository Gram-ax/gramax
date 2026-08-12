import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
// biome-ignore lint/style/noRestrictedImports: will be removed with news sidebars
import styled from "@emotion/styled";
import type { ReactNode } from "react";

interface RightNavigationLayoutProps {
	rightNavigationContent: ReactNode;
	onPointerUp?: () => void;
	onPointerLeave?: () => void;
	onTouchEnd?: () => void;
	className?: string;
}

const RightNavigationLayout = (props: RightNavigationLayoutProps) => {
	const { rightNavigationContent, className, ...otherProps } = props;
	return (
		<div className={cn("bg-sidebar-bg", className)} {...otherProps}>
			<div className="right-nav">{rightNavigationContent}</div>
		</div>
	);
};

export default styled(RightNavigationLayout)`
	height: 100%;
	width: var(--narrow-nav-width);
	color: var(--color-primary-general);

	.right-nav {
		display: flex;
		flex-direction: column;
		padding: 2rem 1.2rem 2rem 2rem;
		height: 100%;
		${() => (useMediaQuery(cssMedia.narrow) ? "padding-top: calc(1rem + var(--top-bar-height));" : "")}
	}

	@media print {
		display: none !important;
	}
`;
