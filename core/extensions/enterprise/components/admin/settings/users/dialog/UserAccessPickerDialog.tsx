import { PickerDialog } from "@ext/enterprise/components/admin/settings/members/dialogs/PickerDialog";
import {
	type UseUserAccessPickerDialogArgs,
	useUserAccessPickerDialog,
} from "@ext/enterprise/components/admin/settings/users/hooks/useUserAccessPickerDialog";
import {
	type UseUserAccessPickerDialogContentArgs,
	useUserAccessPickerDialogContent,
} from "@ext/enterprise/components/admin/settings/users/hooks/useUserAccessPickerDialogContent";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import type { RowSelectionState } from "@ui-kit/DataTable";

type UserAccessPickerDialogProps = UseUserAccessPickerDialogArgs &
	Pick<UseUserAccessPickerDialogContentArgs, "aggregate" | "preselected" | "repoId"> & {
		open: boolean;
		onClose: () => void;
	};

export const UserAccessPickerDialog = (props: UserAccessPickerDialogProps) => {
	const { rowsMap, setRowsMap, selection, setSelection, selectedIds, picked } = useUserAccessPickerDialog(props);
	return (
		<PickerDialog
			count={selectedIds.length}
			onClose={props.onClose}
			onPicked={picked}
			open={props.open}
			title={t("enterprise.admin.resources.adding-user-accesses")}
		>
			<UserAccessPickerDialogContent
				aggregate={props.aggregate}
				preselected={props.preselected}
				repoId={props.repoId}
				rowsMap={rowsMap}
				selectedIds={selectedIds}
				selection={selection}
				setRowsMap={setRowsMap}
				setSelection={setSelection}
			/>
		</PickerDialog>
	);
};

type UserAccessPickerDialogContentProps = UseUserAccessPickerDialogContentArgs & {
	selection: RowSelectionState;
};

const UserAccessPickerDialogContent = (props: UserAccessPickerDialogContentProps) => {
	const { data, headerLeftControls, headerControls } = useUserAccessPickerDialogContent(props);

	return (
		<div className="flex h-full flex-col gap-2">
			{data.ssoEnabled && (
				<span className="text-sm text-muted">{t("enterprise.admin.users.use-search-for-sso")}</span>
			)}
			<SelectableTable
				className="flex flex-col min-h-0"
				columns={data.columns}
				data={data.rows}
				getRowId={data.getRowId}
				isLoading={data.isLoading}
				onRowSelectionChange={props.setSelection}
				onSearchChange={data.filter.query.set}
				rowSelection={props.selection}
				rowVersions={data.rowVersions}
				searchPlaceholder={
					data.ssoEnabled ? t("enterprise.admin.users.find") : t("enterprise.admin.users.find-by-email")
				}
				toolbarActions={headerControls}
				toolbarLeftActions={headerLeftControls}
			/>
		</div>
	);
};
