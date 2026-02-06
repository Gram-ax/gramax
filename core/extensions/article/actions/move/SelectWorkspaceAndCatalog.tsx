import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import type { CatalogSummary } from "@ext/workspace/UnintializedWorkspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import { useCallback, useEffect } from "react";

export type OnSelect = (result: SelectCatalogResult) => void;

interface SelectExistingCatalogResult extends CatalogSummary {
	type: "existing";
	workspacePath: WorkspacePath;
}

interface SelectCreateNewCatalogResult {
	type: "createNew";
	workspacePath: WorkspacePath;
}

export type SelectCatalogResult = SelectExistingCatalogResult | SelectCreateNewCatalogResult;

interface SelectTargetWorkspaceAndCatalog {
	onSelect: OnSelect;
	excludeCurrent?: boolean;
	onlyCurrent?: boolean;
}

interface SelectCatalogProps {
	icon: string;
	workspaceName: string;
	workspacePath: WorkspacePath;
	onSelect: OnSelect;
	asSingle?: boolean;
}

const SelectCatalog = ({ icon, workspaceName, workspacePath, onSelect, asSingle }: SelectCatalogProps) => {
	const catalogName = useCatalogPropsStore((s) => s.data?.name);

	// todo: add zustand state to store the catalog list
	const {
		call: fetchCatalogList,
		data,
		status,
		reset,
	} = useApi<{ catalogSummary: CatalogSummary[] }, CatalogSummary[]>({
		url: (api) => api.getWorkspaceCatalogList(workspacePath),
		onError: () => {
			reset();
		},
		map: (res) => res.catalogSummary?.filter((c) => c.name !== catalogName) ?? [],
		opts: {
			consumeError: false,
		},
	});

	const onOpenChange = async (open: boolean) => {
		if (open && status !== RequestStatus.Ready) await fetchCatalogList();
	};

	const subContent = useCallback(() => {
		switch (status) {
			case RequestStatus.Init || RequestStatus.Loading:
				return (
					<DropdownMenuItem disabled onClick={(ev) => ev.stopPropagation()}>
						<SpinnerLoader height={14} width={14} />
						{t("loading")}
					</DropdownMenuItem>
				);
			case RequestStatus.Error:
				return (
					<DropdownMenuItem disabled onClick={(ev) => ev.stopPropagation()}>
						{t("error")}
					</DropdownMenuItem>
				);
			case RequestStatus.Ready:
				return (
					<>
						<DropdownMenuItem
							onClick={(ev) => {
								ev.stopPropagation();
								onSelect({ type: "createNew", workspacePath });
							}}
						>
							<Icon code="plus" />
							{t("article.move.create-new-catalog")}
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						{data?.length > 0 ? (
							data.map((catalog) => (
								<DropdownMenuItem
									key={catalog.name}
									onClick={(ev) => {
										ev.stopPropagation();
										onSelect({ type: "existing", ...catalog, workspacePath });
									}}
								>
									{catalog.title}
								</DropdownMenuItem>
							))
						) : (
							<DropdownMenuItem disabled>{t("article.move.no-catalogs")}</DropdownMenuItem>
						)}
					</>
				);

			default:
				return null;
		}
	}, [status, data]);

	useEffect(() => {
		if (asSingle) onOpenChange(true);
	}, []);

	if (asSingle) {
		return subContent();
	}

	return (
		<DropdownMenuSub onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger>
				<Icon code={icon || "layers"} />
				{workspaceName}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>{subContent()}</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

const SelectTargetWorkspaceAndCatalog = ({
	excludeCurrent = true,
	onlyCurrent = false,
	onSelect,
}: SelectTargetWorkspaceAndCatalog) => {
	const currentWorkspace = WorkspaceService.current();
	const allWorkspaces = WorkspaceService.workspaces();

	let workspaces =
		excludeCurrent && currentWorkspace
			? allWorkspaces.filter((w) => w.path !== currentWorkspace.path)
			: allWorkspaces;

	if (onlyCurrent) {
		workspaces = [currentWorkspace];
	}

	if (workspaces.length === 0) {
		return <DropdownMenuItem disabled>{t("catalog.move.no-workspaces")}</DropdownMenuItem>;
	}

	return (
		<>
			{workspaces.map((workspace) => (
				<SelectCatalog
					asSingle={workspaces.length <= 1}
					icon={workspace.icon || "layers"}
					key={workspace.path}
					onSelect={onSelect}
					workspaceName={workspace.name}
					workspacePath={workspace.path}
				/>
			))}
		</>
	);
};

export default SelectTargetWorkspaceAndCatalog;
