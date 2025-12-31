import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import RepositoryPermissionTrigger from "@ext/enterprise/components/RepositoryPermission";
import { ReactNode } from "react";

interface RepositoryPermissionItemProps {
	children?: ReactNode;
}

const RepositoryPermissionItem = ({ children }: RepositoryPermissionItemProps) => {
	const { gesUrl, catalogName, sourceName, pathName } = useCatalogActionsContext();

	return (
		<RepositoryPermissionTrigger
			gesUrl={gesUrl}
			catalogName={catalogName}
			pathName={pathName}
			sourceName={sourceName}
		>
			{children}
		</RepositoryPermissionTrigger>
	);
};

export default RepositoryPermissionItem;
