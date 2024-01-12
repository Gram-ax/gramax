import useUrlImage from "@components/Atoms/Image/useImage";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import { CatalogLink } from "../../extensions/navigation/NavigationLinks";
import Actions from "../Actions";

const TopMenu = styled(({ catalogLinks, className }: { catalogLinks: CatalogLink[]; className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<div className={className}>
			<div className="top-menucontainer" data-qa="home-page-top-menu">
				<img
					src={useUrlImage(apiUrlCreator.getLogo(theme))}
					style={{ width: "5.5rem" }}
					data-qa="home-page-logo"
				/>
				<Actions isHomePage={true} catalogLinks={catalogLinks} />
			</div>
		</div>
	);
})`
	width: 100%;

	.top-menucontainer {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		margin-top: 0.5rem;
	}
	.actions {
		display: flex;
		flex-direction: row;
	}
	.auth {
		display: flex;
		font-size: 11px;
		align-items: center;
	}
`;

export default TopMenu;
