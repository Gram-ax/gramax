import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { nameColumn } from "@ext/enterprise/components/admin/settings/members/config/nameColumn";
import { userBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/userBadgesColumn";
import { userColumn } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import {
	emailKey,
	getUserRowId,
	type MemberAggregate,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { TypeFilterDropdown } from "@ext/enterprise/components/admin/settings/users/components/TypeFilterDropdown";
import { AddUserSheet } from "@ext/enterprise/components/admin/settings/users/dialog/AddUserSheet";
import { useUserList } from "@ext/enterprise/components/admin/settings/users/hooks/useUserList";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import type { ColumnDef, RowSelectionState } from "@ui-kit/DataTable";
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from "react";

export interface UseUserPickerDialogContentArgs {
	aggregate: MemberAggregate;
	preselected: Set<string>;
	rowsMap: Map<string, UserMember>;
	setRowsMap: Dispatch<SetStateAction<Map<string, UserMember>>>;
	setSelection: Dispatch<SetStateAction<RowSelectionState>>;
}

export const useUserPickerDialogContent = (args: UseUserPickerDialogContentArgs) => {
	const { aggregate, preselected, setRowsMap, setSelection } = args;
	const { ssoUsersEnabled } = useSettings();

	const [addNewOpen, setAddNewOpen] = useState(false);
	const [createdUsers, setCreatedUsers] = useState<UserMember[]>([]);

	const existingIds = useMemo(() => new Set(aggregate.users.map((x) => emailKey(x.value))), [aggregate.users]);

	const onUsersLoad = useCallback(
		(xs: UserMember[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				xs.map((x) => next.set(x.value, x));
				return next;
			});
		},
		[setRowsMap],
	);

	const userList = useUserList({ aggregate, onUsersLoad, enabled: true });
	const rows = useMemo(
		() => [...createdUsers, ...userList.data.users.filter((x) => !preselected.has(x.value))],
		[userList.data.users, preselected, createdUsers],
	);

	const columns = useMemo<ColumnDef<UserMember>[]>(
		() => [
			userColumn({
				getName: (row) => row.value,
			}),
			...(ssoUsersEnabled
				? [
						nameColumn<UserMember>({
							getName: (row) => row.name,
						}),
					]
				: []),
			userBadgesColumn({
				isEditor: (row) => row.isEditor,
				isWorkspaceOwner: (row) => row.isWorkspaceOwner,
			}),
		],
		[ssoUsersEnabled],
	);

	const createNew = useCallback(
		(email: string) => {
			const user: UserMember = {
				value: email,
				isEditor: false,
				isWorkspaceOwner: false,
			};
			setCreatedUsers((prev) => [...prev, user]);
			setSelection((prev) => ({ ...prev, [email]: true }));
			setRowsMap((prev) => {
				const next = new Map(prev);
				next.set(user.value, user);
				return next;
			});
		},
		[setSelection, setRowsMap],
	);

	const headerLeftControls = (
		<TypeFilterDropdown onSelectType={userList.filter.type.set} selectedType={userList.filter.type.selected} />
	);

	const headerControls = (
		<>
			{!ssoUsersEnabled && (
				<>
					<Button
						className="pl-2.5 pr-3"
						onClick={() => setAddNewOpen(true)}
						startIcon="plus"
						variant="outline"
					>
						{t("enterprise.admin.users.add")}
					</Button>
					<AddUserSheet
						existingKeys={existingIds}
						onCreate={createNew}
						onOpenChange={setAddNewOpen}
						open={addNewOpen}
					/>
				</>
			)}
		</>
	);

	return {
		data: {
			rows: rows,
			columns,
			isLoading: userList.data.isLoading,
			getRowId: getUserRowId,
			filter: userList.filter,
			ssoEnabled: ssoUsersEnabled,
		},
		headerControls,
		headerLeftControls,
	};
};
