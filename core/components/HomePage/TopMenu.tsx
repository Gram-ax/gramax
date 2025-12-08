import Search from "@components/Actions/Modal/Search";
import SingInOut from "@components/Actions/SingInOut";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission, readPermission } from "@ext/security/logic/Permission/Permissions";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import useUrlImage from "../Atoms/Image/useUrlImage";

export type HomePageActionsProps = { catalogLinks: CatalogLink[]; pin?: boolean };

const Logo = ({ className }: { className?: string }) => {
	const breakpoint = useBreakpoint();
	const isMobile = breakpoint !== "xl" && breakpoint !== "lg" && breakpoint !== "2xl";
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { homeLogo } = WorkspaceAssetsService.value();
	const { isTauri } = usePlatform();
	const isMacDesktop = IsMacService.value && isTauri;

	return (
		<div className={classNames(className, { "logo-desktop-padding": isMacDesktop })}>
			<img
				src={homeLogo ? homeLogo : useUrlImage(apiUrlCreator.getLogo(theme, isMobile))}
				className={classNames("home-icon")}
				alt={`logo-${theme}`}
			/>
		</div>
	);
};

const StyledLogo = styled(Logo)`
	.home-icon {
		height: 100%;
	}

	height: 2.25rem;
`;

const TopMenu = () => {
	const { isTauri } = usePlatform();
	const isMacDesktop = IsMacService.value && isTauri;
	const { isNext, isStatic } = usePlatform();
	const hasWorkspace = WorkspaceService.hasActive() && !PageDataContextService.value.isGesUnauthorized;
	const workspacePath = WorkspaceService.current()?.path;

	const canAddCatalog = PermissionService.useCheckPermission(
		isNext ? configureWorkspacePermission : readPermission,
		workspacePath,
	);

	return (
		<div
			data-qa="app-actions"
			className={`w-full bg-alpha-40 top-0 ${isMacDesktop ? "pt-4" : ""}`}
			style={{ backdropFilter: "blur(24px)", position: "sticky", zIndex: "var(--z-index-top-menu)" }}
		>
			<div className="top-menu">
				<div className={`flex flex-row items-center justify-between py-1.5 lg:py-2.5`}>
					<div className="flex flex-row items-center gap-3 lg:gap-6">
						<div>
							<StyledLogo />
						</div>
						<div className="flex flex-row items-center lg:gap-2">
							{!isNext && hasWorkspace && !isStatic && <SwitchWorkspace />}
							{canAddCatalog && hasWorkspace && !isStatic && <AddCatalogMenu />}
						</div>
					</div>
					<div className="flex flex-row items-center gap-0.5 lg:gap-2">
						{hasWorkspace && !isStatic && <Search isHomePage />}
						<SwitchUiLanguage size="lg" />
						<ThemeToggle isHomePage />
						{hasWorkspace && !isStatic && <SingInOut />}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TopMenu;
