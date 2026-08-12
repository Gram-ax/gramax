import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { ChangeRoleButton } from "@ext/enterprise/components/admin/settings/members/components/ChangeRoleButton";
import { branchesColumn } from "@ext/enterprise/components/admin/settings/members/config/branchesColumn";
import { nameColumn } from "@ext/enterprise/components/admin/settings/members/config/nameColumn";
import { roleColumn } from "@ext/enterprise/components/admin/settings/members/config/roleColumn";
import { userBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/userBadgesColumn";
import { userColumn } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import { useAccessDraft } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessDraft";
import {
	emailKey,
	getUserAccessRowId,
	type MemberAggregate,
	type RepoUserAccess,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { getBulkRepoUserRules, getUserRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { TypeFilterDropdown } from "@ext/enterprise/components/admin/settings/users/components/TypeFilterDropdown";
import { AddUserSheet } from "@ext/enterprise/components/admin/settings/users/dialog/AddUserSheet";
import { useUserList } from "@ext/enterprise/components/admin/settings/users/hooks/useUserList";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import type { ColumnDef, RowSelectionState } from "@ui-kit/DataTable";
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from "react";

export interface UseUserAccessPickerDialogContentArgs {
	repoId: string | undefined;
	aggregate: MemberAggregate;
	preselected: Set<string>;
	selection: RowSelectionState;
	selectedIds: string[];
	rowsMap: Map<string, RepoUserAccess>;
	setRowsMap: Dispatch<SetStateAction<Map<string, RepoUserAccess>>>;
	setSelection: Dispatch<SetStateAction<RowSelectionState>>;
}

export const useUserAccessPickerDialogContent = (args: UseUserAccessPickerDialogContentArgs) => {
	const { repoId, aggregate, preselected, rowsMap, selection, selectedIds, setRowsMap, setSelection } = args;
	const { ssoUsersEnabled, searchBranches } = useSettings();

	const [addNewOpen, setAddNewOpen] = useState(false);
	const [createdUsers, setCreatedUsers] = useState<UserMember[]>([]);

	const roleRules = useMemo(() => (repoId ? getUserRules() : getBulkRepoUserRules()), [repoId]);

	const existingIds = useMemo(() => new Set(aggregate.users.map((x) => emailKey(x.value))), [aggregate.users]);

	const onUsersLoad = useCallback(
		(xs: UserMember[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				xs.map((x) => {
					if (next.has(x.value)) return;
					next.set(x.value, {
						user: x,
						role: "reader",
					});
				});
				return next;
			});
		},
		[setRowsMap],
	);

	const userList = useUserList({ aggregate, onUsersLoad, enabled: true });

	const rows = useMemo(() => {
		const others = userList.data.users.filter((x) => !preselected.has(x.value));

		return [...createdUsers, ...others].map<RepoUserAccess>(
			(x) => rowsMap.get(x.value) ?? { user: x, role: "reader" },
		);
	}, [userList.data.users, rowsMap, preselected, createdUsers]);

	const access = useAccessDraft({
		rowsMap,
		setRowsMap,
		roleRules,
		getId: getUserAccessRowId,
	});

	const columns = useMemo<ColumnDef<RepoUserAccess>[]>(
		() => [
			userColumn<RepoUserAccess>({
				getName: (row) => row.user.value,
			}),
			...(ssoUsersEnabled
				? [
						nameColumn<RepoUserAccess>({
							getName: (row) => row.user.name,
						}),
					]
				: []),
			userBadgesColumn({
				isEditor: (row) => row.user.isEditor,
				isWorkspaceOwner: (row) => row.user.isWorkspaceOwner,
			}),
			roleColumn<RepoUserAccess>({
				getRules: () => roleRules,
				getValue: (row) => row.role,
				onChange: (row, role) => access.setRole([row.user.value], role),
				isDisabled: (row) => !selection[row.user.value],
			}),
			branchesColumn<RepoUserAccess>({
				getValue: (row) => row.branches,
				showPicker: (row) => (row.role === "reviewer" ? (!repoId ? "disabled" : true) : false),
				onChange: (row, branches) => access.setBranches(row.user.value, branches, row.role),
				loadBranches: () => searchBranches(repoId),
				getError: (row) => access.branchErrors?.get(row.user.value),
			}),
		],
		[
			access.branchErrors,
			access.setBranches,
			access.setRole,
			roleRules,
			searchBranches,
			selection,
			repoId,
			ssoUsersEnabled,
		],
	);

	const createNew = useCallback(
		(id: string) => {
			const newRow: RepoUserAccess = {
				user: {
					value: id,
					isEditor: false,
					isWorkspaceOwner: false,
				},
				role: "reader",
			};
			access.add([newRow]);
			setCreatedUsers((prev) => [...prev, newRow.user]);
			setSelection((prev) => ({ ...prev, [id]: true }));
			setRowsMap((prev) => {
				const next = new Map(prev);
				next.set(newRow.user.value, newRow);
				return next;
			});
		},
		[setSelection, access.add, setRowsMap],
	);

	const bulkRoleChange = useCallback(
		(role: RoleId) => {
			access.setRole(selectedIds, role);
		},
		[access.setRole, selectedIds],
	);

	const headerLeftControls = (
		<TypeFilterDropdown onSelectType={userList.filter.type.set} selectedType={userList.filter.type.selected} />
	);

	const headerControls = (
		<>
			<ChangeRoleButton count={selectedIds.length} onChange={bulkRoleChange} rules={roleRules} />
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
			rows,
			rowVersions: access.rowVersions,
			columns,
			isLoading: userList.data.isLoading,
			getRowId: getUserAccessRowId,
			filter: userList.filter,
			ssoEnabled: ssoUsersEnabled,
		},
		headerControls,
		headerLeftControls,
	};
};
