import { ReactNode } from "react";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";

const CanEditCatalogHOC = ({ children }: { children: ReactNode }) => {
	const workspacePath = WorkspaceService.current()?.path;
	const canEdit = PermissionService.useCheckPermission(editCatalogPermission, workspacePath);
	
	if (!canEdit) return null;
	return children;
};

export default CanEditCatalogHOC;

