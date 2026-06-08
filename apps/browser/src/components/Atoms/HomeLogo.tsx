import getLogo from "@components/HomePage/logos/getLogo";
import { getSrc } from "@components/HomePage/logos/utils";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import ThemeService from "@ext/Theme/components/ThemeService";

export const HomeLogo = () => {
	const theme = ThemeService.value;
	const breakpoint = useBreakpoint();
	const isMobile = breakpoint !== "xl" && breakpoint !== "lg" && breakpoint !== "2xl";

	const { homeLogo } = WorkspaceAssetsService.value();

	return (
		<img
			alt={`logo-${theme}`}
			className="home-icon h-[2.25rem]"
			src={homeLogo ? homeLogo : getSrc(getLogo(theme, isMobile))}
		/>
	);
};
