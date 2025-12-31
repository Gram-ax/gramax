import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogMoveAction, {
	CatalogMoveActionRenderProps,
} from "@ext/catalog/actions/move/components/CatalogMoveAction";
import SelectTargetWorkspace from "@ext/catalog/actions/move/components/SelectTargetWorkspace";
import { ReactNode } from "react";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";

interface CatalogMoveItemProps {
	children?: (props: CatalogMoveActionRenderProps) => ReactNode;
}

const CatalogMoveItem = ({ children }: CatalogMoveItemProps) => {
	const { catalogName } = useCatalogActionsContext();

	return (
		<IsReadOnlyHOC>
			<CatalogMoveAction catalogName={catalogName}>{children}</CatalogMoveAction>
		</IsReadOnlyHOC>
	);
};

interface CatalogMoveSelectProps {
	targetWorkspaceRef: CatalogMoveActionRenderProps["targetWorkspaceRef"];
	checkAndMove: CatalogMoveActionRenderProps["checkAndMove"];
}

export const CatalogMoveSelectItem = ({ targetWorkspaceRef, checkAndMove }: CatalogMoveSelectProps) => {
	const { catalogName } = useCatalogActionsContext();

	return (
		<SelectTargetWorkspace
			onClick={(workspace) => {
				targetWorkspaceRef.current = workspace;
				checkAndMove({
					url: (api) => api.getCatalogNameAfterMove(catalogName, workspace.path),
				});
			}}
			excludeCurrent
		/>
	);
};

export default CatalogMoveItem;
