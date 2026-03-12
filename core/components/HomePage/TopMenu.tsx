import SingInOut from "@components/Actions/SingInOut";
import { classNames } from "@components/libs/classNames";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission, editCatalogContentPermission } from "@ext/security/logic/Permission/Permissions";
import Search from "@ext/serach/components/Search";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import type React from "react";
import type { Environment } from "../../../app/resolveModule/env";
import SignInModalTrigger from "../../extensions/enterprise-cloud/components/SignInModalTrigger";
import { TopMenuStyledLogo } from "./TopMenuLogo";

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

const TopMenuSwitchUiLanguageButton: React.FC = () => <SwitchUiLanguage size="lg" />;

const TopMenuSearch: React.FC = () => <Search isHomePage />;

const TopMenuThemeToggle: React.FC = () => <ThemeToggle isHomePage />;

export const topMenuItemClassName = "hover:bg-alpha-high-97 menu-open";

const components: Record<Environment, () => React.ReactNode> = {
	tauri: () => <TauriEditorTopMenu />,
	next: () => <DocportalTopMenu />,
	static: () => <StaticTopMenu />,
	browser: () => <BrowserEditorTopMenu />,
	cli: () => <StaticTopMenu />,
	test: () => null,
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

const StaticTopMenu: React.FC = () => {
	return (
		<TopMenuWrapper>
			<TopMenuLeftSideWithLogo />
			<TopMenuRightSide>
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const TauriEditorTopMenu: React.FC = () => {
	const isMacDesktop = IsMacService.value;

	return (
		<TopMenuWrapper className={isMacDesktop ? "pt-4" : ""}>
			<EditorTopMenuInnerContent />
		</TopMenuWrapper>
	);
};

const BrowserEditorTopMenu: React.FC = () => {
	return (
		<TopMenuWrapper>
			<EditorTopMenuInnerContent />
		</TopMenuWrapper>
	);
};

const DocportalTopMenu: React.FC = () => {
	const hasWorkspace = WorkspaceService.hasActive();
	const workspacePath = WorkspaceService.current()?.path;
	const canAddCatalog = PermissionService.useCheckPermission(configureWorkspacePermission, workspacePath);

	return (
		<TopMenuWrapper>
			<TopMenuLeftSideWithLogo>{canAddCatalog && hasWorkspace && <AddCatalogMenu />}</TopMenuLeftSideWithLogo>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				{hasWorkspace && <SingInOut />}
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const EditorTopMenuInnerContent: React.FC = () => {
	const { gesUrl, isCloud } = PageDataContextService.value.conf.enterprise;
	const isEnterprise = !!gesUrl;

	let component: React.ReactNode;
	if (isEnterprise && isCloud) component = <GESCloudEditorTopMenuInnerContent />;
	else if (isEnterprise && !isCloud) component = <GESEditorTopMenuInnerContent />;
	else component = <OpenSourceEditorTopMenuInnerContent />;

	return component;
};

const GESEditorTopMenuInnerContent: React.FC = () => {
	const hasWorkspace = WorkspaceService.hasActive() && !PageDataContextService.value.isGesUnauthorized;
	const canAddCatalog = PermissionService.useCheckAnyCatalogPermission(editCatalogContentPermission);

	return (
		<>
			<TopMenuLeftSideWithLogo>
				{hasWorkspace && <SwitchWorkspace />}
				{canAddCatalog && hasWorkspace && <AddCatalogMenu />}
			</TopMenuLeftSideWithLogo>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				{hasWorkspace && <SingInOut />}
			</TopMenuRightSide>
		</>
	);
};

const GESCloudEditorTopMenuInnerContent: React.FC = () => {
	const isGesUnauthorized = PageDataContextService.value.isGesUnauthorized;
	const { gesUrl } = PageDataContextService.value.conf.enterprise;
	const hasWorkspace = WorkspaceService.hasActive() && !isGesUnauthorized;

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
				{hasWorkspace && <SingInOut />}
				{isGesUnauthorized && <SignInModalTrigger gesUrl={gesUrl} />}
			</TopMenuRightSide>
		</>
	);
};

const OpenSourceEditorTopMenuInnerContent: React.FC = () => {
	const hasWorkspace = WorkspaceService.hasActive();

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
				{hasWorkspace && <SingInOut />}
			</TopMenuRightSide>
		</>
	);
};
