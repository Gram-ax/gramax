import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { setCardLoading } from "@components/HomePage/CardParts/CardStore";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import Workspace from "@core-ui/ContextServices/Workspace";
import { RequestStatus, useDeferApi } from "@core-ui/hooks/useApi";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import t from "@ext/localization/locale/translate";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ComponentProps, type MutableRefObject, type ReactNode, useRef } from "react";
import DuplicateCatalogDialog from "./DuplicateCatalogDialog";
export interface CatalogMoveActionRenderProps {
	targetWorkspaceRef: MutableRefObject<ClientWorkspaceConfig | null>;
	checkAndMove: (params: { url: (api: any) => string }) => void;
}

interface CatalogWorkspaceActionsProps {
	catalogName: string;
	onSuccess?: () => void;
	children?: (props: CatalogMoveActionRenderProps) => ReactNode;
}

const CatalogMoveAction = ({ children, catalogName, onSuccess }: CatalogWorkspaceActionsProps) => {
	const targetWorkspaceRef = useRef<ClientWorkspaceConfig | null>(null);

	const { start: setCardLoadingDebounce, cancel: cancelCardLoadingDebounce } = useDebounce(
		() => {
			setCardLoading(catalogName, true);
		},
		50,
		true,
	);

	const { call: moveCatalog, status: moveCatalogStatus } = useDeferApi({
		url: (api) => api.moveCatalog(targetWorkspaceRef.current?.path, catalogName, catalogName, null),
		onStart: () => {
			setCardLoadingDebounce();
		},
		onFinally: () => {
			cancelCardLoadingDebounce();
			setCardLoading(catalogName, false);
		},
		onDone: () => {
			targetWorkspaceRef.current = null;
			SourceDataService.refresh();
			refreshPage();
			onSuccess?.();
		},
	});

	const { call: checkAndMove, status: getCatalogNameAfterMoveStatus } = useDeferApi<{
		resolvedDirName: string;
		idx: number;
		exists: boolean;
	}>({
		onDone: async (data) => {
			if (!targetWorkspaceRef.current) return;

			if (!data.exists) {
				await moveCatalog();
				return;
			}

			ModalToOpenService.setValue<ComponentProps<typeof DuplicateCatalogDialog>>(
				ModalToOpen.DuplicateCatalogDialog,
				{
					catalogName,
					targetWorkspaceName: targetWorkspaceRef.current?.name,
					onResolve: async (resolution) => {
						ModalToOpenService.resetValue();
						await moveCatalog({
							url: (api) =>
								api.moveCatalog(
									targetWorkspaceRef.current?.path,
									catalogName,
									data.resolvedDirName,
									resolution,
									` ${data.idx}`,
								),
						});
					},
				},
			);
		},
	});

	const isLoading =
		moveCatalogStatus === RequestStatus.Loading || getCatalogNameAfterMoveStatus === RequestStatus.Loading;

	const currentWorkspace = Workspace.current();
	const workspaces = Workspace.workspaces();

	const isGes = !!currentWorkspace.enterprise?.gesUrl;
	if (isGes) return null;

	if (workspaces.length < 2) {
		return (
			<Tooltip>
				<TooltipTrigger className="w-full" onClick={(ev) => ev.stopPropagation()}>
					<DropdownMenuItem disabled onClick={(ev) => ev.stopPropagation()}>
						<Icon code="arrow-right" />
						{t("catalog.move.to-workspace")}
					</DropdownMenuItem>
				</TooltipTrigger>
				<TooltipContent>{t("catalog.move.no-workspaces")}</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<CatalogItem
			renderLabel={(Component) => (
				<Component disabled={isLoading} onClick={(ev) => ev.stopPropagation()}>
					{isLoading ? <SpinnerLoader height={16} width={16} /> : <Icon code="arrow-right" />}
					{t("catalog.move.to-workspace")}
				</Component>
			)}
		>
			{children?.({ targetWorkspaceRef, checkAndMove })}
		</CatalogItem>
	);
};

export default CatalogMoveAction;
