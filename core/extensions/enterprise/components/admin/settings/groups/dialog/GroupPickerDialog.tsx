import {
	type UseGroupPickerDialogArgs,
	useGroupPickerDialog,
} from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupPickerDialog";
import {
	type UseGroupPickerDialogContentArgs,
	useGroupPickerDialogContent,
} from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupPickerDialogContent";
import { PickerDialog } from "@ext/enterprise/components/admin/settings/members/dialogs/PickerDialog";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import type { RowSelectionState } from "@ui-kit/DataTable";

type GroupPickerDialogProps = UseGroupPickerDialogArgs &
	Pick<UseGroupPickerDialogContentArgs, "aggregate" | "preselected"> & {
		open: boolean;
		onClose: () => void;
	};

export const GroupPickerDialog = (props: GroupPickerDialogProps) => {
	const { rowsMap, setRowsMap, selection, setSelection, selectedIds, picked } = useGroupPickerDialog(props);
	return (
		<PickerDialog
			count={selectedIds.length}
			onClose={props.onClose}
			onPicked={picked}
			open={props.open}
			title={t("enterprise.admin.groups.adding-many")}
		>
			<GroupPickerDialogContent
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

type GroupPickerDialogContentProps = UseGroupPickerDialogContentArgs & {
	selection: RowSelectionState;
};

const GroupPickerDialogContent = (props: GroupPickerDialogContentProps) => {
	const { data, headerLeftControls, headerControls } = useGroupPickerDialogContent(props);

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
				searchPlaceholder={t("enterprise.admin.groups.find")}
				toolbarActions={headerControls}
				toolbarLeftActions={headerLeftControls}
			/>
		</div>
	);
};
