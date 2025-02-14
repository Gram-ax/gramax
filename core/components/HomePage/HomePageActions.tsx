import Search from "@components/Actions/Modal/Search";
import SingInOut from "@components/Actions/SingInOut";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission, editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";

export type HomePageActionsProps = { catalogLinks: CatalogLink[]; className?: string; pin?: boolean };

const HomePageActions = ({ catalogLinks, className }: HomePageActionsProps) => {
	const { isNext } = usePlatform();
	const hasWorkspace = WorkspaceService.hasActive();
	const workspacePath = WorkspaceService?.current()?.path;

	const canEditCatalog = PermissionService.useCheckPermission(editCatalogPermission, workspacePath);
	const canConfigureWorkspace = PermissionService.useCheckPermission(configureWorkspacePermission, workspacePath);
	const canAddCatalog = (isNext && canConfigureWorkspace) || (!isNext && canEditCatalog);

	return (
		<div className={className} data-qa="app-actions">
			{!isNext && hasWorkspace && <SwitchWorkspace />}
			{hasWorkspace && <Search isHomePage catalogLinks={catalogLinks} />}
			<SwitchUiLanguage />
			<ThemeToggle />
			{canAddCatalog && hasWorkspace && <AddCatalogMenu />}
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

	${(props) =>
		props.pin &&
		css`
			position: absolute;
			right: 1rem;
			top: 6px;
		`}

	> * {
		z-index: var(--z-index-base);
	}

	${cssMedia.narrow} {
		.button,
		.buttonLink .content {
			font-size: 1rem !important;
		}

		gap: var(--distance-actions-mobile);

		i + span {
			display: none;
		}
	}
`;
