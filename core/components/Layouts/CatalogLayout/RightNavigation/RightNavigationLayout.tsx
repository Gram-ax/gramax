import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { useMediaQuery } from "@mui/material";
import RightNavigation from "./RightNavigation";

const RightNavigationLayout = styled(({ itemLinks, className }: { itemLinks: ItemLink[]; className?: string }) => {
	return (
		<div className={className}>
			<div className="right-nav">
				<RightNavigation itemLinks={itemLinks} />
			</div>
		</div>
	);
})`
	height: 100%;
	width: var(--narrow-nav-width);
	background: var(--color-contextmenu-bg);
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

export default RightNavigationLayout;
