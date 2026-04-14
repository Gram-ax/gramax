import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import RepositoryPermissionTrigger from "@ext/enterprise/components/RepositoryPermission";
import type { ReactNode } from "react";

interface RepositoryPermissionItemProps {
	children?: ReactNode;
}

const RepositoryPermissionItem = ({ children }: RepositoryPermissionItemProps) => {
	const { workspaceGesUrl, catalogName, sourceName, pathName } = useCatalogActionsContext();

	return (
		<RepositoryPermissionTrigger
			catalogName={catalogName}
			gesUrl={workspaceGesUrl}
			pathName={pathName}
			sourceName={sourceName}
		>
			{children}
		</RepositoryPermissionTrigger>
	);
};

export default RepositoryPermissionItem;
