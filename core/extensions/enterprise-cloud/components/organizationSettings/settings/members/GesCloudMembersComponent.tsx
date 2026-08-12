import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertDeleteDialog } from "../../../../../enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TabInitialLoader } from "../../../../../enterprise/components/admin/ui-kit/TabInitialLoader";
import { TableComponent } from "../../../../../enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "../../../../../enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "../../../../../enterprise/components/admin/ui-kit/table/TableToolbar";
import { UserToolbarInviteBtn } from "../components/UserToolbarInviteBtn";
import { getGesCloudUsersTableColumns } from "./config/GesCloudUsersTableConfig";
import type { GesCloudMember } from "./types/GesCloudUsersComponentTypes";

const GES_CLOUD_FREE_PLAN_MEMBER_LIMIT = 100;

const GesCloudUsersComponent = () => {
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;
	const gesCloudApi = useMemo(() => new GesCloudApi(gesCloudUrl), [gesCloudUrl]);

	const [members, setMembers] = useState<GesCloudMember[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [rowSelection, setRowSelection] = useState({});
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		const loadMembers = async () => {
			try {
				const membersData = await gesCloudApi.getMembers();
				setMembers(membersData);
			} catch (error) {
				setSaveError(error instanceof Error ? error.message : "Failed to load members");
			} finally {
				setIsLoading(false);
			}
		};

		loadMembers();
	}, [gesCloudApi]);

	const columns = useMemo(() => getGesCloudUsersTableColumns(), []);

	const table = useReactTable({
		data: members,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete button wont appear without this
	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	const deleteSelected = useCallback(async () => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const selectedUserEmails = selectedRows.map((row) => row.original.email);

		try {
			await gesCloudApi.excludeMembers(selectedUserEmails);
			const updatedMembers = members.filter((member) => !selectedUserEmails.includes(member.email));
			setMembers(updatedMembers);
			setRowSelection({});
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Failed to exclude members");
		}
	}, [members, table, gesCloudApi]);

	const handleInviteUser = useCallback(
		async (email: string) => {
			if (!members.some((member) => member.email === email)) {
				try {
					await gesCloudApi.inviteUser(email);
					const newMember: GesCloudMember = { email, type: "invite" };
					setMembers([...members, newMember]);
					setSaveError(null);
				} catch (error) {
					setSaveError(error instanceof Error ? error.message : "Failed to invite user");
				}
			}
		},
		[members, gesCloudApi],
	);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("email")?.setFilterValue(value);
		},
		[table],
	);

	if (isLoading) return <TabInitialLoader />;

	return (
		<div className="p-6">
			<FloatingAlert message={saveError} show={Boolean(saveError)} />

			<TableInfoBlock
				description={
					<span>
						{members.length}/{GES_CLOUD_FREE_PLAN_MEMBER_LIMIT}
					</span>
				}
				title={t("enterprise-cloud.org-settings.pages.users")}
			/>

			<div>
				<TableToolbar
					input={
						<TableToolbarTextInput
							onChange={handleFilterChange}
							placeholder={t("enterprise-cloud.org-settings.users.placeholder")}
							value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
						/>
					}
				>
					<AlertDeleteDialog
						hidden={!selectedCount}
						onConfirm={deleteSelected}
						selectedCount={selectedCount}
					/>

					<UserToolbarInviteBtn
						disabled={members.length >= GES_CLOUD_FREE_PLAN_MEMBER_LIMIT}
						existingUsers={members.map((member) => member.email)}
						key="invite-user"
						onInvite={handleInviteUser}
					/>
				</TableToolbar>

				<TableComponent<GesCloudMember> columns={columns} table={table} />
			</div>
		</div>
	);
};

export default GesCloudUsersComponent;
