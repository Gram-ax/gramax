import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { AddGroupSheet } from "@ext/enterprise/components/admin/settings/groups/dialog/AddGroupSheet";
import { useGroupList } from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupList";
import { ChangeRoleButton } from "@ext/enterprise/components/admin/settings/members/components/ChangeRoleButton";
import { branchesColumn } from "@ext/enterprise/components/admin/settings/members/config/branchesColumn";
import { groupBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/groupBadgesColumn";
import { groupColumn } from "@ext/enterprise/components/admin/settings/members/config/groupColumn";
import { roleColumn } from "@ext/enterprise/components/admin/settings/members/config/roleColumn";
import { useAccessDraft } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessDraft";
import {
	type GroupMember,
	getGroupAccessRowId,
	type MemberAggregate,
	type RepoGroupAccess,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useGroupRoleRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { TypeFilterDropdown } from "@ext/enterprise/components/admin/settings/users/components/TypeFilterDropdown";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import type { ColumnDef, RowSelectionState } from "@ui-kit/DataTable";
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from "react";

export interface UseGroupAccessPickerDialogContentArgs {
	aggregate: MemberAggregate;
	preselected: Set<string>;
	selection: RowSelectionState;
	selectedIds: string[];
	rowsMap: Map<string, RepoGroupAccess>;
	setRowsMap: Dispatch<SetStateAction<Map<string, RepoGroupAccess>>>;
	setSelection: Dispatch<SetStateAction<RowSelectionState>>;
}

export const useGroupAccessPickerDialogContent = (args: UseGroupAccessPickerDialogContentArgs) => {
	const { aggregate, preselected, rowsMap, selection, selectedIds, setRowsMap, setSelection } = args;
	const { ssoGroupsEnabled } = useSettings();

	const [addNewOpen, setAddNewOpen] = useState(false);
	const [createdGroups, setCreatedGroups] = useState<GroupMember[]>([]);

	const { roleRules } = useGroupRoleRules();

	const existingIds = useMemo(() => new Set(aggregate.groups.map((x) => x.id)), [aggregate.groups]);

	const onGroupsLoad = useCallback(
		(xs: GroupMember[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				xs.map((x) => {
					if (next.has(x.id)) return;
					next.set(x.id, {
						group: x,
						role: "reader",
					});
				});
				return next;
			});
		},
		[setRowsMap],
	);

	const groupList = useGroupList({ aggregate, onGroupsLoad, enabled: true });

	const access = useAccessDraft({
		rowsMap,
		setRowsMap,
		roleRules,
		getId: getGroupAccessRowId,
	});

	const rows = useMemo(() => {
		const others = groupList.data.groups.filter((x) => !preselected.has(x.id));

		return [...createdGroups, ...others].map<RepoGroupAccess>(
			(x) => rowsMap.get(x.id) ?? { group: x, role: "reader" },
		);
	}, [rowsMap, groupList.data.groups, preselected, createdGroups]);

	const columns = useMemo<ColumnDef<RepoGroupAccess>[]>(
		() => [
			groupColumn({
				getId: (row) => row.group.id,
				getLabel: (row) => row.group.name,
			}),
			groupBadgesColumn({
				getId: (row) => row.group.id,
				getSource: (row) => row.group.source,
				isWorkspaceOwner: (row) => row.group.isWorkspaceOwner,
			}),
			roleColumn({
				getRules: () => roleRules,
				getValue: (row) => row.role,
				onChange: (row, role) => access.setRole([row.group.id], role),
				isDisabled: (row) => !selection[row.group.id],
			}),
			branchesColumn({}),
		],
		[access.setRole, roleRules, selection],
	);

	const createNew = useCallback(
		(id: string) => {
			const newRow: RepoGroupAccess = {
				group: {
					id,
					name: id,
					isSystem: false,
					source: GroupSource.GX_GROUPS,
					isWorkspaceOwner: false,
				},
				role: "reader",
			};
			access.add([newRow]);
			setCreatedGroups((prev) => [...prev, newRow.group]);
			setSelection((prev) => ({ ...prev, [id]: true }));
			setRowsMap((prev) => {
				const next = new Map(prev);
				next.set(newRow.group.id, newRow);
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
		<TypeFilterDropdown<"owner">
			onSelectType={groupList.filter.type.set}
			selectedType={groupList.filter.type.selected}
			types={["owner"]}
		/>
	);

	const headerControls = (
		<>
			<ChangeRoleButton count={selectedIds.length} onChange={bulkRoleChange} rules={roleRules} />
			<Button className="pl-2.5 pr-3" onClick={() => setAddNewOpen(true)} startIcon="plus" variant="outline">
				{t("enterprise.admin.groups.add")}
			</Button>
			<AddGroupSheet
				existingKeys={existingIds}
				onCreate={createNew}
				onOpenChange={setAddNewOpen}
				open={addNewOpen}
			/>
		</>
	);

	return {
		data: {
			rows,
			rowVersions: access.rowVersions,
			columns,
			isLoading: groupList.data.isLoading,
			getRowId: getGroupAccessRowId,
			filter: groupList.filter,
			ssoEnabled: ssoGroupsEnabled,
		},
		headerControls,
		headerLeftControls,
	};
};
