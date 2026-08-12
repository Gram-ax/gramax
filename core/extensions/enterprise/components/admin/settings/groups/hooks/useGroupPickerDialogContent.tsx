import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { AddGroupSheet } from "@ext/enterprise/components/admin/settings/groups/dialog/AddGroupSheet";
import { useGroupList } from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupList";
import { groupBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/groupBadgesColumn";
import { groupColumn } from "@ext/enterprise/components/admin/settings/members/config/groupColumn";
import {
	type GroupMember,
	getGroupRowId,
	type MemberAggregate,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { TypeFilterDropdown } from "@ext/enterprise/components/admin/settings/users/components/TypeFilterDropdown";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import type { ColumnDef, RowSelectionState } from "@ui-kit/DataTable";
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from "react";

export interface UseGroupPickerDialogContentArgs {
	aggregate: MemberAggregate;
	preselected: Set<string>;
	rowsMap: Map<string, GroupMember>;
	setRowsMap: Dispatch<SetStateAction<Map<string, GroupMember>>>;
	setSelection: Dispatch<SetStateAction<RowSelectionState>>;
}

export const useGroupPickerDialogContent = (args: UseGroupPickerDialogContentArgs) => {
	const { aggregate, preselected, setRowsMap, setSelection } = args;
	const { ssoGroupsEnabled } = useSettings();

	const [addNewOpen, setAddNewOpen] = useState(false);
	const [createdGroups, setCreatedGroups] = useState<GroupMember[]>([]);

	const existingIds = useMemo(() => new Set(aggregate.groups.map((x) => x.id)), [aggregate.groups]);

	const onGroupsLoad = useCallback(
		(xs: GroupMember[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				xs.map((x) => next.set(x.id, x));
				return next;
			});
		},
		[setRowsMap],
	);

	const groupList = useGroupList({ aggregate, onGroupsLoad, enabled: true });
	const rows = useMemo(
		() => [
			...createdGroups,
			...groupList.data.groups.filter(
				(x) => !preselected.has(x.id) && x.source === GroupSource.GX_GROUPS && !x.isSystem,
			),
		],
		[groupList.data.groups, preselected, createdGroups],
	);

	const columns = useMemo<ColumnDef<GroupMember>[]>(
		() => [
			groupColumn({
				getId: (row) => row.id,
				getLabel: (row) => row.name,
			}),
			groupBadgesColumn({
				getId: (row) => row.id,
				getSource: (row) => row.source,
				isWorkspaceOwner: (row) => row.isWorkspaceOwner,
			}),
		],
		[],
	);

	const createNew = useCallback(
		(id: string) => {
			const group: GroupMember = {
				id,
				name: id,
				source: GroupSource.GX_GROUPS,
				isSystem: false,
				isWorkspaceOwner: false,
			};
			setCreatedGroups((prev) => [...prev, group]);
			setSelection((prev) => ({ ...prev, [id]: true }));
			setRowsMap((prev) => {
				const next = new Map(prev);
				next.set(group.id, group);
				return next;
			});
		},
		[setSelection, setRowsMap],
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
			rows: rows,
			columns,
			isLoading: groupList.data.isLoading,
			getRowId: getGroupRowId,
			filter: groupList.filter,
			ssoEnabled: ssoGroupsEnabled,
		},
		headerControls,
		headerLeftControls,
	};
};
