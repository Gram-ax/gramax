import type { Environment } from "@app/resolveModule/env";
import { DocportalTopMenu } from "@components/HomePage/TopMenu/DocportalTopMenu";
import { TopMenuStyledLogo } from "@components/HomePage/TopMenuLogo";
import { classNames } from "@components/libs/classNames";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import { GesCloudSignInOut, SingInBrowser, SingInTauri } from "@ext/enterprise/components/SingInOut/SingInOut";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogContentPermission } from "@ext/security/logic/Permission/Permissions";
import Search from "@ext/serach/components/Search";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import type React from "react";

const TopMenuWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
	return (
		<div
			className={classNames(`w-full bg-alpha-40 top-0`, {}, [className])}
			data-qa="top-menu"
			data-testid="top-menu"
			role="menubar"
			style={{ backdropFilter: "blur(24px)", position: "sticky", zIndex: "var(--z-index-top-menu)" }}
		>
			<div className="top-menu">
				<div className={`flex flex-row items-center justify-between py-1.5 lg:py-2.5`}>{children}</div>
			</div>
		</div>
	);
};

const TopMenuLeftSideWithLogo = ({ children }: { children?: React.ReactNode }) => {
	return (
		<div className="flex flex-row items-center gap-3 lg:gap-6">
			<div>
				<TopMenuStyledLogo />
			</div>
			<div className="flex flex-row items-center lg:gap-2">{children}</div>
		</div>
	);
};

const TopMenuRightSide = ({ children }: { children: React.ReactNode }) => {
	return <div className="flex flex-row items-center gap-0.5 lg:gap-2">{children}</div>;
};

const TopMenuSwitchUiLanguageButton = () => <SwitchUiLanguage size="lg" />;

const TopMenuSearch = () => <Search isHomePage />;

const TopMenuThemeToggle = () => <ThemeToggle isHomePage />;

export const topMenuItemClassName = "hover:bg-alpha-high-97 menu-open";

const components: Record<Environment, () => React.ReactNode> = {
	tauri: () => <TauriEditorTopMenu />,
	next: () => <DocportalTopMenu />,
	static: () => <StaticTopMenu />,
	browser: () => <BrowserEditorTopMenu />,
	cli: () => <StaticTopMenu />,
	test: () => null,
	docportal: () => null,
};

const TopMenu = () => {
	const { environment } = usePlatform();
	return components[environment]();
};

export default styled(TopMenu)`
	.menu-open[data-state="open"] {
		background-color: hsl(var(--alpha-high-05));
	}
`;

const StaticTopMenu = () => {
	return (
		<TopMenuWrapper>
			<TopMenuLeftSideWithLogo />
			<TopMenuRightSide>
				<SwitchUiLanguage size="lg" />
				<ThemeToggle isHomePage />
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const TauriEditorTopMenu = () => {
	const isMacDesktop = IsMacService.value;
	const canAddCatalog = PermissionService.useCheckAnyCatalogPermission(editCatalogContentPermission);
	const hasWorkspace = WorkspaceService.hasActive();

	return (
		<TopMenuWrapper className={isMacDesktop ? "pt-4" : ""}>
			<TopMenuLeftSideWithLogo>
				{hasWorkspace && <SwitchWorkspace />}
				{canAddCatalog && hasWorkspace && <AddCatalogMenu />}
			</TopMenuLeftSideWithLogo>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				<SingInTauri />
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const BrowserEditorTopMenu = () => {
	const hasWorkspace = WorkspaceService.hasActive() && !false;
	const canAddCatalog = PermissionService.useCheckAnyCatalogPermission(editCatalogContentPermission);
	const isEnterprise = PageDataContextService.value.conf.enterprise.gesUrl;

	return (
		<TopMenuWrapper>
			<TopMenuLeftSideWithLogo>
				{hasWorkspace && <SwitchWorkspace />}
				{canAddCatalog && hasWorkspace && <AddCatalogMenu />}
			</TopMenuLeftSideWithLogo>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				{isEnterprise && <SingInBrowser />}
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const GESCloudEditorTopMenuInnerContent = () => {
	const isLogged = PageDataContextService.value.isLogged;
	const hasWorkspace = WorkspaceService.hasActive() && isLogged;

	return (
		<>
			<TopMenuLeftSideWithLogo>
				{hasWorkspace && <SwitchWorkspace />}
				{hasWorkspace && <AddCatalogMenu />}
			</TopMenuLeftSideWithLogo>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				<GesCloudSignInOut />
			</TopMenuRightSide>
		</>
	);
};
