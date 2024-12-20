import { getExecutingEnvironment } from "@app/resolveModule/env";
import HomePageActions from "@components/HomePage/HomePageActions";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsMacService from "@core-ui/ContextServices/IsMac";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import styled from "@emotion/styled";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import useUrlImage from "../Atoms/Image/useUrlImage";

const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	margin-top: 0.5rem;

	.home-icon {
		display: flex;
		justify-content: start;
		align-items: center;
	}

	.home-icon-wrapper {
		max-height: 2.5rem;
	}

	.default-icon {
		width: 5.5rem;
	}
`;

const Logo = () => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { homeLogo } = WorkspaceAssetsService.value();
	const isMacDesktop = IsMacService.value && getExecutingEnvironment() == "tauri";
	const marginTop = isMacDesktop ? "1.4rem" : "0px";

	return (
		<div
			className={classNames("home-icon-wrapper", { "logo-desktop-padding": isMacDesktop })}
			style={{ marginTop }}
		>
			<img
				src={homeLogo ? homeLogo : useUrlImage(apiUrlCreator.getLogo(theme))}
				className={classNames("home-icon", { "default-icon": !homeLogo })}
				alt={"logo"}
			/>
		</div>
	);
};

const TopMenu = ({ catalogLinks }: { catalogLinks: CatalogLink[] }) => {
	return (
		<Wrapper>
			<Logo />
			<HomePageActions catalogLinks={catalogLinks} />
		</Wrapper>
	);
};

export default TopMenu;
