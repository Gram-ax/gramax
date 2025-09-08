import Search from "@components/Actions/Modal/Search";
import SingInOut from "@components/Actions/SingInOut";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsMacService from "@core-ui/ContextServices/IsMac";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission, editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import useUrlImage from "../Atoms/Image/useUrlImage";
import { styled } from "@mui/material";

export type HomePageActionsProps = { catalogLinks: CatalogLink[]; pin?: boolean };

const Logo = ({ className }: { className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { homeLogo } = WorkspaceAssetsService.value();
	const { isTauri } = usePlatform();
	const isMacDesktop = IsMacService.value && isTauri;

	return (
		<div className={classNames(className, { "logo-desktop-padding": isMacDesktop })}>
			<img
				src={homeLogo ? homeLogo : useUrlImage(apiUrlCreator.getLogo(theme))}
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

const TopMenu = ({ catalogLinks }: { catalogLinks: CatalogLink[] }) => {
	const { isTauri } = usePlatform();
	const isMacDesktop = IsMacService.value && isTauri;
	const { isNext, isStatic } = usePlatform();
	const hasWorkspace = WorkspaceService.hasActive();
	const workspacePath = WorkspaceService.current()?.path;

	const canEditCatalog = PermissionService.useCheckPermission(editCatalogPermission, workspacePath);
	const canConfigureWorkspace = PermissionService.useCheckPermission(configureWorkspacePermission, workspacePath);
	const canAddCatalog = (isNext && canConfigureWorkspace) || (!isNext && canEditCatalog);

	return (
		<div
			data-qa="app-actions"
			className={`w-full bg-alpha-40 top-0 px-4 ${isMacDesktop ? "pt-4" : ""}`}
			style={{ backdropFilter: "blur(5px)", position: "sticky", zIndex: "var(--z-index-top-menu)" }}
		>
			<div className="w-full mx-auto flex max-w-[1144px] flex-row items-center justify-between py-2 relative">
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
					{hasWorkspace && !isStatic && <Search isHomePage catalogLinks={catalogLinks} />}
					<SwitchUiLanguage />
					<ThemeToggle isHomePage />
					{hasWorkspace && !isStatic && <SingInOut />}
				</div>
			</div>
		</div>
	);
};

export default TopMenu;
