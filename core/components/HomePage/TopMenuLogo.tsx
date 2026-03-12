import getLogo from "@components/HomePage/logos/getLogo";
import { getSrc } from "@components/HomePage/logos/utils";
import { classNames } from "@components/libs/classNames";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import styled from "@emotion/styled";
import ThemeService from "../../extensions/Theme/components/ThemeService";

const Logo = ({ className }: { className?: string }) => {
	const breakpoint = useBreakpoint();
	const isMobile = breakpoint !== "xl" && breakpoint !== "lg" && breakpoint !== "2xl";
	const theme = ThemeService.value;
	const { homeLogo } = WorkspaceAssetsService.value();

	return (
		<div className={className}>
			<img
				alt={`logo-${theme}`}
				className={classNames("home-icon")}
				src={homeLogo ? homeLogo : getSrc(getLogo(theme, isMobile))}
			/>
		</div>
	);
};

export const TopMenuStyledLogo = styled(Logo)`
	.home-icon {
		height: 100%;
	}

	height: 2.25rem;
`;
