import { PickerDialog } from "@ext/enterprise/components/admin/settings/members/dialogs/PickerDialog";
import {
	type UseUserPickerDialogArgs,
	useUserPickerDialog,
} from "@ext/enterprise/components/admin/settings/users/hooks/useUserPickerDialog";
import {
	type UseUserPickerDialogContentArgs,
	useUserPickerDialogContent,
} from "@ext/enterprise/components/admin/settings/users/hooks/useUserPickerDialogContent";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import type { RowSelectionState } from "@ui-kit/DataTable";

type UserPickerDialogProps = UseUserPickerDialogArgs &
	Pick<UseUserPickerDialogContentArgs, "aggregate" | "preselected"> & {
		open: boolean;
		onClose: () => void;
	};

export const UserPickerDialog = (props: UserPickerDialogProps) => {
	const { rowsMap, setRowsMap, selection, setSelection, selectedIds, picked } = useUserPickerDialog(props);
	return (
		<PickerDialog
			count={selectedIds.length}
			onClose={props.onClose}
			onPicked={picked}
			open={props.open}
			title={t("enterprise.admin.users.adding-many")}
		>
			<UserPickerDialogContent
				aggregate={props.aggregate}
				preselected={props.preselected}
				rowsMap={rowsMap}
				selection={selection}
				setRowsMap={setRowsMap}
				setSelection={setSelection}
			/>
		</PickerDialog>
	);
};

type UserPickerDialogContentProps = UseUserPickerDialogContentArgs & {
	selection: RowSelectionState;
};

const UserPickerDialogContent = (props: UserPickerDialogContentProps) => {
	const { data, headerLeftControls, headerControls } = useUserPickerDialogContent(props);

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
				searchPlaceholder={
					data.ssoEnabled ? t("enterprise.admin.users.find") : t("enterprise.admin.users.find-by-email")
				}
				toolbarActions={headerControls}
				toolbarLeftActions={headerLeftControls}
			/>
		</div>
	);
};
