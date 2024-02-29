import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";
import { ItemLink } from "@ext/navigation/NavigationLinks";
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
	height: 100vh;
	overflow: auto;
	width: var(--narrow-nav-width);
	background: var(--color-contextmenu-bg);
	color: var(--color-primary-general);

	.right-nav {
		padding: 20px;
		${() => (useMediaQuery(cssMedia.narrow) ? "padding-top: 84px;" : "")}
	}

	@media print {
		display: none !important;
	}
`;

export default RightNavigationLayout;
