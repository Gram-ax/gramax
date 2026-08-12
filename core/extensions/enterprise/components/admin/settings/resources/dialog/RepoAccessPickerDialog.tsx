import { PickerDialog } from "@ext/enterprise/components/admin/settings/members/dialogs/PickerDialog";
import {
	type UseRepoAccessPickerDialogArgs,
	useRepoAccessPickerDialog,
} from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoAccessPickerDialog";
import {
	type UseRepoAccessPickerDialogContentArgs,
	useRepoAccessPickerDialogContent,
} from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoAccessPickerDialogContent";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import type { RowSelectionState } from "@ui-kit/DataTable";

type RepoAccessPickerDialogProps = UseRepoAccessPickerDialogArgs &
	Pick<UseRepoAccessPickerDialogContentArgs, "aggregate" | "preselected" | "roleRules"> & {
		open: boolean;
		onClose: () => void;
	};

export const RepoAccessPickerDialog = (props: RepoAccessPickerDialogProps) => {
	const { rowsMap, setRowsMap, selection, setSelection, selectedIds, picked } = useRepoAccessPickerDialog(props);
	return (
		<PickerDialog
			count={selectedIds.length}
			onClose={props.onClose}
			onPicked={picked}
			open={props.open}
			title={t("enterprise.admin.adding-accesses")}
		>
			<RepoAccessPickerDialogContent
				aggregate={props.aggregate}
				preselected={props.preselected}
				roleRules={props.roleRules}
				rowsMap={rowsMap}
				selectedIds={selectedIds}
				selection={selection}
				setRowsMap={setRowsMap}
				setSelection={setSelection}
			/>
		</PickerDialog>
	);
};

type RepoAccessPickerDialogContentProps = UseRepoAccessPickerDialogContentArgs & {
	selection: RowSelectionState;
};

const RepoAccessPickerDialogContent = (props: RepoAccessPickerDialogContentProps) => {
	const { data, headerControls } = useRepoAccessPickerDialogContent(props);

	return (
		<div className="flex h-full flex-col gap-3">
			<SelectableTable
				className="flex flex-col h-full min-h-0"
				columns={data.columns}
				data={data.rows}
				getRowId={data.getRowId}
				onRowSelectionChange={props.setSelection}
				rowSelection={props.selection}
				rowVersions={data.rowVersions}
				searchColumnId={data.searchColumnId}
				searchPlaceholder={t("enterprise.admin.resources.find")}
				sortable={data.sortable}
				toolbarActions={headerControls}
			/>
		</div>
	);
};
