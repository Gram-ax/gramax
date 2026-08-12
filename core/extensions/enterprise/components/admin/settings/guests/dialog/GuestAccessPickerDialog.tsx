import {
	type UseGuestAccessPickerDialogArgs,
	useGuestAccessPickerDialog,
} from "@ext/enterprise/components/admin/settings/guests/hooks/useGuestAccessPickerDialog";
import {
	type UseGuestAccessPickerDialogContentArgs,
	useGuestAccessPickerDialogContent,
} from "@ext/enterprise/components/admin/settings/guests/hooks/useGuestAccessPickerDialogContent";
import { PickerDialog } from "@ext/enterprise/components/admin/settings/members/dialogs/PickerDialog";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import type { RowSelectionState } from "@ui-kit/DataTable";

type GuestAccessPickerDialogProps = UseGuestAccessPickerDialogArgs &
	Pick<UseGuestAccessPickerDialogContentArgs, "aggregate" | "preselected" | "whitelistEnabled" | "domains"> & {
		open: boolean;
		onClose: () => void;
	};

export const GuestAccessPickerDialog = (props: GuestAccessPickerDialogProps) => {
	const { rowsMap, setRowsMap, selection, setSelection, selectedIds, picked } = useGuestAccessPickerDialog(props);
	return (
		<PickerDialog
			count={selectedIds.length}
			onClose={props.onClose}
			onPicked={picked}
			open={props.open}
			title={t("enterprise.admin.resources.adding-guest-accesses")}
		>
			<GuestAccessPickerDialogContent
				aggregate={props.aggregate}
				domains={props.domains}
				preselected={props.preselected}
				rowsMap={rowsMap}
				selection={selection}
				setRowsMap={setRowsMap}
				setSelection={setSelection}
				whitelistEnabled={props.whitelistEnabled}
			/>
		</PickerDialog>
	);
};

type GuestAccessPickerDialogContentProps = UseGuestAccessPickerDialogContentArgs & {
	selection: RowSelectionState;
};

const GuestAccessPickerDialogContent = (props: GuestAccessPickerDialogContentProps) => {
	const { data, headerControls } = useGuestAccessPickerDialogContent(props);

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
				searchPlaceholder={t("enterprise.admin.guests.find-readers")}
				sortable={data.sortable}
				toolbarActions={headerControls}
			/>
		</div>
	);
};
