import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { useMemo } from "react";

const useShouldRenderDeleteCatalog = () => {
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const workspacePath = WorkspaceService.current()?.path;
	const { cloudServiceUrl } = PageDataContextService.value.conf;

	const canConfigureCatalog = PermissionService.useCheckPermission(
		configureCatalogPermission,
		workspacePath,
		catalogName,
	);
	const { environment } = usePlatform();

	const shouldRenderDeleteCatalog = useMemo(() => {
		switch (environment) {
			case "next":
				return !!canConfigureCatalog;
			case "browser":
				return true;
			case "tauri":
				return true;
			case "static":
				return !!cloudServiceUrl;
			case "cli":
				return false;
		}
	}, [canConfigureCatalog, cloudServiceUrl, environment]);

	return shouldRenderDeleteCatalog;
};

export default useShouldRenderDeleteCatalog;
