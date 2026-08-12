import { AddGuestSheet } from "@ext/enterprise/components/admin/settings/guests/dialog/AddGuestSheet";
import { branchesColumn } from "@ext/enterprise/components/admin/settings/members/config/branchesColumn";
import { guestColumn, guestColumnId } from "@ext/enterprise/components/admin/settings/members/config/guestColumn";
import { roleColumn } from "@ext/enterprise/components/admin/settings/members/config/roleColumn";
import { useAccessDraft } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessDraft";
import {
	emailKey,
	type GuestMember,
	getGuestAccessRowId,
	type MemberAggregate,
	type RepoGuestAccess,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useGuestRoleRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import type { RowSelectionState } from "@ui-kit/DataTable";
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from "react";

export interface UseGuestAccessPickerDialogContentArgs {
	aggregate: MemberAggregate;
	preselected: Set<string>;
	rowsMap: Map<string, RepoGuestAccess>;
	setRowsMap: Dispatch<SetStateAction<Map<string, RepoGuestAccess>>>;
	setSelection: Dispatch<SetStateAction<RowSelectionState>>;
	whitelistEnabled?: boolean;
	domains?: string[];
}

export const useGuestAccessPickerDialogContent = (args: UseGuestAccessPickerDialogContentArgs) => {
	const { aggregate, preselected, rowsMap, setRowsMap, setSelection, whitelistEnabled, domains } = args;

	const [addNewOpen, setAddNewOpen] = useState(false);
	const [createdGuests, setCreatedGuests] = useState<GuestMember[]>([]);

	const { roleRules } = useGuestRoleRules();

	const existingIds = useMemo(() => new Set(aggregate.guests.map((x) => emailKey(x.value))), [aggregate.guests]);

	const rows = useMemo(() => {
		const others = aggregate.guests.filter((x) => !preselected.has(x.value));

		return [...createdGuests, ...others].map<RepoGuestAccess>(
			(x) => rowsMap.get(x.value) ?? { guest: x, role: "reader" },
		);
	}, [aggregate.guests, preselected, createdGuests, rowsMap]);

	const access = useAccessDraft({
		rowsMap,
		roleRules,
		setRowsMap,
		getId: getGuestAccessRowId,
	});

	const columns = useMemo(
		() => [
			guestColumn<RepoGuestAccess>({
				getName: (row) => row.guest.value,
			}),
			roleColumn<RepoGuestAccess>({
				getRules: () => roleRules,
				getValue: () => "reader",
				onChange: () => {},
			}),
			branchesColumn<RepoGuestAccess>({}),
		],
		[roleRules],
	);

	const createNew = useCallback(
		(id: string) => {
			const newRow: RepoGuestAccess = {
				guest: {
					value: id,
				},
				role: "reader",
			};
			access.add([newRow]);
			setCreatedGuests((prev) => [...prev, newRow.guest]);
			setSelection((prev) => ({ ...prev, [id]: true }));
			setRowsMap((prev) => {
				const next = new Map(prev);
				next.set(newRow.guest.value, newRow);
				return next;
			});
		},
		[setSelection, access.add, setRowsMap],
	);

	const headerControls = (
		<>
			<Button className="pl-2.5 pr-3" onClick={() => setAddNewOpen(true)} startIcon="plus" variant="outline">
				{t("enterprise.admin.guests.add")}
			</Button>
			<AddGuestSheet
				domains={domains}
				existingKeys={existingIds}
				onCreate={createNew}
				onOpenChange={setAddNewOpen}
				open={addNewOpen}
				whitelistEnabled={whitelistEnabled}
			/>
		</>
	);

	return {
		data: {
			rows: rows,
			rowVersions: access.rowVersions,
			columns,
			getRowId: getGuestAccessRowId,
			searchColumnId: guestColumnId,
			sortable: true,
		},
		headerControls,
	};
};
