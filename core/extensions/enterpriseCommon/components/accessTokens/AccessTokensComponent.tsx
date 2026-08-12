import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertDeleteDialog } from "../../../enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TabInitialLoader } from "../../../enterprise/components/admin/ui-kit/TabInitialLoader";
import { TableComponent } from "../../../enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "../../../enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "../../../enterprise/components/admin/ui-kit/table/TableToolbar";
import type { TokenCreatePayload } from "./CreateAccessTokenModal";
import { getGesCloudTokensTableColumns } from "./config/GesCloudTokensTableConfig";
import type { AccessTokenItem } from "./types/AccessTokensComponentTypes";

interface AccessTokensComponentProps {
	getTokens: () => Promise<AccessTokenItem[]>;
	createToken: (payload: TokenCreatePayload) => Promise<string>;
	revokeToken: (id: string) => Promise<void>;
}

const AccessTokensComponent = ({ getTokens, createToken, revokeToken }: AccessTokensComponentProps) => {
	const [tokens, setTokens] = useState<AccessTokenItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [rowSelection, setRowSelection] = useState({});
	const [loadError, setLoadError] = useState<string | null>(null);
	const [createError, setCreateError] = useState<string | null>(null);
	const [revokeError, setRevokeError] = useState<string | null>(null);

	useEffect(() => {
		const loadTokens = async () => {
			try {
				const tokensData = await getTokens();
				setTokens(tokensData);
			} catch (error) {
				setLoadError(error instanceof Error ? error.message : "Failed to load tokens");
			} finally {
				setIsLoading(false);
			}
		};

		void loadTokens();
	}, [getTokens]);

	const columns = useMemo(() => getGesCloudTokensTableColumns(), []);

	const table = useReactTable({
		data: tokens,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("name")?.setFilterValue(value);
		},
		[table],
	);

	const handleCreateToken = useCallback(
		async ({ name, expiresAt }: TokenCreatePayload) => {
			try {
				const token = await createToken({ name, expiresAt });
				setCreateError(null);
				const showModalId = ModalToOpenService.addModal(ModalToOpen.ShowAccessToken, {
					token,
					onClose: () => ModalToOpenService.removeModal(showModalId),
				});
				const refreshedTokens = await getTokens();
				setTokens(refreshedTokens);
			} catch (error) {
				setCreateError(error instanceof Error ? error.message : "Failed to create token");
			}
		},
		[getTokens, createToken],
	);

	const handleCreateClick = useCallback(() => {
		const createModalId = ModalToOpenService.addModal(ModalToOpen.CreateAccessToken, {
			onCreate: handleCreateToken,
			onClose: () => ModalToOpenService.removeModal(createModalId),
		});
	}, [handleCreateToken]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete button wont appear without this
	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	const revokeSelected = useCallback(async () => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const selectedIds = selectedRows.map((row) => row.original.id);

		try {
			await Promise.all(selectedIds.map((id) => revokeToken(id)));
			setTokens((prev) => prev.filter((token) => !selectedIds.includes(token.id)));
			setRowSelection({});
			setRevokeError(null);
		} catch (error) {
			setRevokeError(error instanceof Error ? error.message : "Failed to revoke tokens");
		}
	}, [table, revokeToken]);

	if (isLoading) return <TabInitialLoader />;

	return (
		<div className="p-6">
			<FloatingAlert
				message={loadError ?? createError ?? revokeError}
				show={Boolean(loadError ?? createError ?? revokeError)}
			/>

			<TableInfoBlock
				description={<span>{tokens.length}</span>}
				title={t("enterprise-cloud.org-settings.pages.access-tokens")}
			/>

			<div>
				<TableToolbar
					input={
						<TableToolbarTextInput
							onChange={handleFilterChange}
							placeholder={t("enterprise-cloud.org-settings.tokens.placeholder")}
							value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
						/>
					}
				>
					<AlertDeleteDialog
						hidden={!selectedCount}
						onConfirm={revokeSelected}
						selectedCount={selectedCount}
					/>

					<Button className="ml-auto" onClick={handleCreateClick} startIcon="plus" variant="outline">
						{t("enterprise-cloud.org-settings.tokens.create")}
					</Button>
				</TableToolbar>

				<TableComponent<AccessTokenItem> columns={columns} table={table} />
			</div>
		</div>
	);
};

export default AccessTokensComponent;
