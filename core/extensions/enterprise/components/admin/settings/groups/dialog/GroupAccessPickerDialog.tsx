import {
	type UseGroupAccessPickerDialogArgs,
	useGroupAccessPickerDialog,
} from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupAccessPickerDialog";
import {
	type UseGroupAccessPickerDialogContentArgs,
	useGroupAccessPickerDialogContent,
} from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupAccessPickerDialogContent";
import { PickerDialog } from "@ext/enterprise/components/admin/settings/members/dialogs/PickerDialog";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import type { RowSelectionState } from "@ui-kit/DataTable";

type GroupAccessPickerDialogProps = UseGroupAccessPickerDialogArgs &
	Pick<UseGroupAccessPickerDialogContentArgs, "aggregate" | "preselected"> & {
		open: boolean;
		onClose: () => void;
	};

export const GroupAccessPickerDialog = (props: GroupAccessPickerDialogProps) => {
	const { rowsMap, setRowsMap, selection, setSelection, selectedIds, picked } = useGroupAccessPickerDialog(props);
	return (
		<PickerDialog
			count={selectedIds.length}
			onClose={props.onClose}
			onPicked={picked}
			open={props.open}
			title={t("enterprise.admin.resources.adding-group-accesses")}
		>
			<GroupAccessPickerDialogContent
				aggregate={props.aggregate}
				preselected={props.preselected}
				rowsMap={rowsMap}
				selectedIds={selectedIds}
				selection={selection}
				setRowsMap={setRowsMap}
				setSelection={setSelection}
			/>
		</PickerDialog>
	);
};

type GroupAccessPickerDialogContentProps = UseGroupAccessPickerDialogContentArgs & {
	selection: RowSelectionState;
};

const GroupAccessPickerDialogContent = (props: GroupAccessPickerDialogContentProps) => {
	const { data, headerLeftControls, headerControls } = useGroupAccessPickerDialogContent(props);

	return (
		<div className="flex h-full flex-col gap-2">
			{data.ssoEnabled && (
				<span className="text-sm text-muted">{t("enterprise.admin.groups.use-search-for-sso")}</span>
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
				searchPlaceholder={t("enterprise.admin.groups.find")}
				toolbarActions={headerControls}
				toolbarLeftActions={headerLeftControls}
			/>
		</div>
	);
};
