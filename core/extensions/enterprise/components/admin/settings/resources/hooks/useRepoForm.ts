import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import {
	getGroupAccessRowId,
	getGuestAccessRowId,
	getUserAccessRowId,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import type { RepoFormState } from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoFormState";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { useMemo } from "react";

interface UseRepoFormArgs {
	state: RepoFormState;
}

export const useRepoForm = ({ state }: UseRepoFormArgs) => {
	const { aggregate, groupAccess, userAccess, guestAccess } = state;

	const groupPickerState = useOpenState({ keyBase: "group" });
	const userPickerState = useOpenState({ keyBase: "user" });
	const guestPickerState = useOpenState({ keyBase: "guest" });

	const groupPreselected = useMemo(() => {
		return new Set(groupAccess.rows.map((x) => x.group.id));
	}, [groupAccess.rows]);

	const {
		rowSelection: groupSelection,
		setRowSelection: setGroupSelection,
		selectedRows: selectedGroups,
	} = useRowSelectionWithData(groupAccess.rows, getGroupAccessRowId);

	const userPreselected = useMemo(() => {
		return new Set(userAccess.rows.map((x) => x.user.value));
	}, [userAccess.rows]);

	const {
		rowSelection: userSelection,
		setRowSelection: setUserSelection,
		selectedRows: selectedUsers,
	} = useRowSelectionWithData(userAccess.rows, getUserAccessRowId);

	const guestPreselected = useMemo(() => {
		return new Set(guestAccess.rows.map((x) => x.guest.value));
	}, [guestAccess.rows]);

	const {
		rowSelection: guestSelection,
		setRowSelection: setGuestSelection,
		selectedRows: selectedGuests,
	} = useRowSelectionWithData(guestAccess.rows, getGuestAccessRowId);

	return {
		data: state.data,
		group: {
			...groupAccess,
			getId: getGroupAccessRowId,
			preselected: groupPreselected,
			selection: groupSelection,
			setSelection: setGroupSelection,
			selected: selectedGroups,
			picker: {
				...groupPickerState,
				picked: groupAccess.add,
			},
		},
		user: {
			...userAccess,
			getId: getUserAccessRowId,
			preselected: userPreselected,
			selection: userSelection,
			setSelection: setUserSelection,
			selected: selectedUsers,
			picker: {
				...userPickerState,
				picked: userAccess.add,
			},
		},
		guest: {
			...guestAccess,
			getId: getGuestAccessRowId,
			preselected: guestPreselected,
			selection: guestSelection,
			setSelection: setGuestSelection,
			selected: selectedGuests,
			picker: {
				...guestPickerState,
				picked: guestAccess.add,
			},
		},
		aggregate,
		isAdd: state.isAdd,
	};
};
