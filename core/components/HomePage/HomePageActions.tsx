import Search from "@components/Actions/Modal/Search";
import SingInOut from "@components/Actions/SingInOut";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import type { HTMLAttributes } from "react";

export type HomePageActionsProps = { catalogLinks: CatalogLink[] } & HTMLAttributes<HTMLDivElement>;

const HomePageActions = ({ catalogLinks, ...props }: HomePageActionsProps) => {
	const pageProps = PageDataContextService.value;
	const isReadOnly = pageProps.conf.isReadOnly;
	const hasWorkspace = WorkspaceService.hasActive();
	const canConfigureWorkspace = PermissionService.useCheckPermission(configureWorkspacePermission);

	return (
		<div {...props} data-qa="app-actions">
			{!isReadOnly && hasWorkspace && <SwitchWorkspace />}
			{hasWorkspace && <Search isHomePage catalogLinks={catalogLinks} />}
			<SwitchUiLanguage />
			<ThemeToggle />
			{canConfigureWorkspace && hasWorkspace && pageProps?.isLogged && <AddCatalogMenu />}
			{hasWorkspace && <SingInOut isHomePage />}
		</div>
	);
};

export default styled(HomePageActions)`
	display: flex;
	align-items: start;
	flex-direction: row;
	gap: var(--distance-actions);
	justify-content: space-between;

	> * {
		z-index: var(--z-index-base);
	}

	${cssMedia.narrow} {
		i + span {
			display: none;
		}
	}
`;
