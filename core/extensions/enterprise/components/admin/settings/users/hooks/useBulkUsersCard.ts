import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { groupBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/groupBadgesColumn";
import { groupColumn, groupColumnId } from "@ext/enterprise/components/admin/settings/members/config/groupColumn";
import {
	type BulkAccessRow,
	useBulkAccessDraft,
} from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import {
	type BulkLinkedRow,
	useBulkLinkedDraft,
} from "@ext/enterprise/components/admin/settings/members/hooks/useBulkLinkedDraft";
import { useEditorSheet } from "@ext/enterprise/components/admin/settings/members/hooks/useEditorSheet";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import {
	emailKey,
	type GesRepo,
	type GroupMember,
	getBulkGroupRowId,
	getBulkRepoRowId,
	getGroupRowId,
	getRepoRowId,
	getUserRowId,
	type MemberAccess,
	type MemberAggregate,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import {
	isMixedRole,
	MIXED_ROLE,
	useBulkRepoUserRoleRules,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { repoColumn, repoColumnId } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { buildBulkUserChanges } from "@ext/enterprise/components/admin/settings/users/model/buildBulkUserChanges";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { deepEqual } from "@ext/enterprise/utils/deepEqual";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";

interface UseBulkUsersCardArgs {
	users: UserMember[];
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const useBulkUsersCard = (args: UseBulkUsersCardArgs) => {
	const { users, aggregate, onApply, onClose } = args;

	const accessPickerState = useOpenState({ keyBase: "access" });
	const groupPickerState = useOpenState({ keyBase: "group" });

	const { roleRules } = useBulkRepoUserRoleRules();

	const accessInitial = useMemo(() => {
		const res = new Map<string, BulkAccessRow<GesRepo, UserMember>>();
		for (const g of users) {
			const accesses = aggregate.userAccesses.get(emailKey(g.value));
			if (!accesses) continue;
			for (const a of accesses) {
				const repo = aggregate.repoById.get(a.resourceId);
				if (!repo) continue;
				let ex = res.get(a.resourceId);
				if (!ex) {
					ex = {
						ent: repo,
						role: a.role,
						branches: a.branches,
						containers: new Map(),
					};
					res.set(a.resourceId, ex);
				}

				if (ex.role !== a.role) {
					ex.role = MIXED_ROLE;
				}

				if (!deepEqual(ex.branches, a.branches)) {
					// TODO: uneditable
					ex.branches = undefined;
				}

				ex.containers.set(g.value, {
					cont: g,
					role: a.role,
					branches: a.branches,
				});
			}
		}
		return res;
	}, [aggregate.userAccesses, aggregate.repoById, users]);

	const {
		rows: accessRows,
		columns: accessBaseColumns,
		remove: removeRepos,
		add: addAccesses,
		applyToAll: addAccessesToAll,
		rowVersions: accessRowVersion,
		validate: validateAccesses,
	} = useBulkAccessDraft({
		initial: accessInitial,
		allContainers: users,
		getEntId: getRepoRowId,
		getContId: getUserRowId,
		roleRules,
	});

	const accessColumns = useMemo(
		() => [
			repoColumn<BulkAccessRow<GesRepo, UserMember>>({
				getValue: (row) => row.ent.id,
			}),
			...accessBaseColumns,
		],
		[accessBaseColumns],
	);

	const {
		rowSelection: accessSelection,
		setRowSelection: setAccessSelection,
		selectedRows: selectedAccesses,
	} = useRowSelectionWithData(accessRows, getBulkRepoRowId);

	const accessPreselected = useMemo(() => new Set(accessRows.map((r) => r.ent.id)), [accessRows]);

	const removeSelectedAccesses = useCallback(() => {
		removeRepos(selectedAccesses.map((x) => x.ent.id));
	}, [selectedAccesses, removeRepos]);

	const addSelectedAccessesToAll = useCallback(() => {
		addAccessesToAll(selectedAccesses);
	}, [selectedAccesses, addAccessesToAll]);

	const isAccessApplyToAllDisabled = useMemo(
		() =>
			selectedAccesses.some((row) => {
				const role = isMixedRole(row.role) ? "reader" : row.role;
				return Boolean(roleRules.disabledReason(role));
			}),
		[selectedAccesses, roleRules],
	);

	const addPickedAccesses = useCallback(
		(adding: MemberAccess[]) => {
			addAccesses(
				adding.map((x) => ({
					ent: {
						id: x.resourceId,
						isBase: false,
						groupAccess: [],
						guestAccess: [],
						userAccess: [],
					},
					role: x.role,
					branches: x.branches,
				})),
			);
		},
		[addAccesses],
	);

	const [linkedMap, setLinkedMap] = useState(() => {
		const res = new Map<string, BulkLinkedRow<GroupMember, UserMember>>();
		for (const g of users) {
			const groups = aggregate.userToGroups.get(emailKey(g.value));
			if (!groups) continue;
			for (const a of groups) {
				const group = aggregate.groupsById.get(a);
				if (!group) continue;
				let ex = res.get(a);
				if (!ex) {
					ex = {
						ent: group,
						containers: new Map(),
					};
					res.set(a, ex);
				}

				ex.containers.set(g.value, {
					cont: g,
				});
			}
		}
		return res;
	});

	const {
		rows: groupRows,
		columns: groupBaseColumns,
		remove: removeGroups,
		add: addGroups,
		applyToAll: addGroupsToAll,
	} = useBulkLinkedDraft({
		rowsMap: linkedMap,
		setRowsMap: setLinkedMap,
		allContainers: users,
		getEntId: getGroupRowId,
		getContId: getUserRowId,
	});

	const groupColumns = useMemo<ColumnDef<BulkLinkedRow<GroupMember, UserMember>>[]>(
		() => [
			groupColumn({
				getId: (row) => row.ent.id,
				getLabel: (row) => row.ent.name,
			}),
			groupBadgesColumn({
				getId: (row) => row.ent.id,
				getSource: (row) => row.ent.source,
				isWorkspaceOwner: (row) => row.ent.isWorkspaceOwner,
			}),
			...groupBaseColumns,
		],
		[groupBaseColumns],
	);

	const {
		rowSelection: groupSelection,
		setRowSelection: setGroupSelection,
		selectedRows: selectedGroups,
	} = useRowSelectionWithData(groupRows, getBulkGroupRowId);

	const groupPreselected = useMemo(() => new Set(groupRows.map((x) => x.ent.id)), [groupRows]);

	const removeSelectedGroups = useCallback(() => {
		removeGroups(selectedGroups.map((x) => x.ent.id));
	}, [selectedGroups, removeGroups]);

	const addSelectedGroupsToAll = useCallback(() => {
		addGroupsToAll(selectedGroups);
	}, [selectedGroups, addGroupsToAll]);

	const addPickedGroups = useCallback(
		(picked: GroupMember[]) => {
			addGroups(picked.map((x) => ({ ent: x })));
		},
		[addGroups],
	);

	const buildChanges = useCallback(() => {
		return buildBulkUserChanges({
			users,
			draftAccess: accessRows,
			draftGroup: groupRows,
			origAccess: aggregate.userAccesses,
			origGroup: aggregate.userToGroups,
		});
	}, [users, aggregate.userAccesses, aggregate.userToGroups, accessRows, groupRows]);

	const { saving, saveError, showUnsaved, setShowUnsaved, requestClose, persist, submit, close } = useEditorSheet({
		buildChanges,
		apply: onApply,
		onClose,
		validate: validateAccesses,
	});

	return {
		access: {
			rows: accessRows,
			rowVersions: accessRowVersion,
			getId: getBulkRepoRowId,
			columns: accessColumns,
			preselected: accessPreselected,
			selection: accessSelection,
			setSelection: setAccessSelection,
			selected: selectedAccesses,
			add: addAccesses,
			removeSelected: removeSelectedAccesses,
			addSelectedToAll: addSelectedAccessesToAll,
			isApplyToAllDisabled: isAccessApplyToAllDisabled,
			searchColumnId: repoColumnId,
			picker: {
				...accessPickerState,
				picked: addPickedAccesses,
			},
		},
		group: {
			rows: groupRows,
			getId: getBulkGroupRowId,
			columns: groupColumns,
			preselected: groupPreselected,
			selection: groupSelection,
			setSelection: setGroupSelection,
			selected: selectedGroups,
			add: addPickedGroups,
			removeSelected: removeSelectedGroups,
			addSelectedToAll: addSelectedGroupsToAll,
			searchColumnId: groupColumnId,
			picker: {
				...groupPickerState,
				picked: addPickedGroups,
			},
		},
		form: {
			saving,
			saveError,
			showUnsaved,
			setShowUnsaved,
			persist,
			submit,
			close,
			requestClose,
		},
		aggregate,
		roleRules,
	};
};
