import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { buildBulkGroupChanges } from "@ext/enterprise/components/admin/settings/groups/model/buildBulkGroupChanges";
import { nameColumn } from "@ext/enterprise/components/admin/settings/members/config/nameColumn";
import { userColumn, userColumnId } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import {
	type AccessRow,
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
	getBulkRepoRowId,
	getBulkUserRowId,
	getGroupRowId,
	getRepoRowId,
	getUserRowId,
	isSystemGroup,
	type MemberAccess,
	type MemberAggregate,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import {
	isMixedRole,
	MIXED_ROLE,
	useGroupRoleRules,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { repoColumn, repoColumnId } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseBulkGroupsCardArgs {
	groups: GroupMember[];
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const useBulkGroupsCard = (args: UseBulkGroupsCardArgs) => {
	const { groups, aggregate, onApply, onClose } = args;

	const { ssoUsersEnabled } = useSettings();

	const accessPickerState = useOpenState({ keyBase: "access" });
	const userPickerState = useOpenState({ keyBase: "user" });

	const hasSystemOrSso = useMemo(() => groups.some(isSystemGroup), [groups]);

	const { roleRules } = useGroupRoleRules();

	const accessInitial = useMemo(() => {
		const res = new Map<string, BulkAccessRow<GesRepo, GroupMember>>();
		for (const g of groups) {
			const accesses = aggregate.groupAccesses.get(g.id);
			if (!accesses) continue;
			for (const a of accesses) {
				const repo = aggregate.repoById.get(a.resourceId);
				if (!repo) continue;
				let ex = res.get(a.resourceId);
				if (!ex) {
					ex = {
						ent: repo,
						role: a.role,
						containers: new Map(),
					};
					res.set(a.resourceId, ex);
				}

				if (ex.role !== a.role) {
					ex.role = MIXED_ROLE;
				}

				ex.containers.set(g.id, {
					cont: g,
					role: a.role,
				});
			}
		}
		return res;
	}, [aggregate.groupAccesses, aggregate.repoById, groups]);

	const getGroupNames = (xs: AccessRow<GroupMember>[]) => {
		return xs.map((x) => x.cont.name);
	};

	const {
		rows: accessRows,
		columns: baseColumns,
		remove: removeRepos,
		add: addAccesses,
		applyToAll: addAccessesToAll,
		rowVersions,
		validate,
	} = useBulkAccessDraft({
		initial: accessInitial,
		allContainers: groups,
		roleRules,
		getEntId: getRepoRowId,
		getContId: getGroupRowId,
		getNames: getGroupNames,
	});

	const accessColumns = useMemo(
		() => [
			repoColumn<BulkAccessRow<GesRepo, GroupMember>>({
				getValue: (row) => row.ent.id,
			}),
			...baseColumns,
		],
		[baseColumns],
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

	const [linkedMap, setLinkedMap] = useState(new Map<string, BulkLinkedRow<UserMember, GroupMember>>());

	useEffect(() => {
		setLinkedMap((prev) => {
			const next = new Map(prev);
			for (const g of groups) {
				const users = aggregate.groupToUsers.get(g.id);
				if (!users) continue;
				for (const a of users) {
					const user = aggregate.usersByValue.get(emailKey(a));
					if (!user) continue;
					let ex = next.get(a);
					if (!ex) {
						ex = {
							ent: user,
							containers: new Map(),
						};
						next.set(a, ex);
					} else {
						ex.ent = user;
					}

					ex.containers.set(g.id, {
						cont: g,
					});
				}
			}
			return next;
		});
	}, [aggregate.groupToUsers, groups, aggregate.usersByValue]);

	const {
		rows: userRows,
		columns: userBaseColumns,
		remove: removeUsers,
		add: addUsers,
		applyToAll: addUsersToAll,
	} = useBulkLinkedDraft({
		rowsMap: linkedMap,
		setRowsMap: setLinkedMap,
		allContainers: groups,
		getContId: getGroupRowId,
		getEntId: getUserRowId,
	});

	const userColumns = useMemo<ColumnDef<BulkLinkedRow<UserMember, GroupMember>>[]>(
		() => [
			userColumn({
				getName: (row) => row.ent.value,
			}),
			...(ssoUsersEnabled
				? [
						nameColumn<BulkLinkedRow<UserMember, GroupMember>>({
							getName: (row) => row.ent.name,
						}),
					]
				: []),
			...userBaseColumns,
		],
		[userBaseColumns, ssoUsersEnabled],
	);

	const {
		rowSelection: userSelection,
		setRowSelection: setUserSelection,
		selectedRows: selectedUsers,
	} = useRowSelectionWithData(userRows, getBulkUserRowId);

	const userPreselected = useMemo(() => new Set(userRows.map((r) => r.ent.value)), [userRows]);

	const removeSelectedUsers = useCallback(() => {
		removeUsers(selectedUsers.map((x) => x.ent.value));
	}, [selectedUsers, removeUsers]);

	const addSelectedUsersToAll = useCallback(() => {
		addUsersToAll(selectedUsers);
	}, [selectedUsers, addUsersToAll]);

	const addPickedUsers = useCallback(
		(picked: UserMember[]) => {
			addUsers(picked.map((x) => ({ ent: x })));
		},
		[addUsers],
	);

	const buildChanges = useCallback(
		() =>
			buildBulkGroupChanges({
				groups,
				draftAccess: accessRows,
				draftUser: userRows,
				origAccess: aggregate.groupAccesses,
				origUser: aggregate.groupToUsers,
			}),
		[groups, aggregate.groupAccesses, aggregate.groupToUsers, accessRows, userRows],
	);

	const { saving, saveError, showUnsaved, setShowUnsaved, requestClose, persist, submit, close } = useEditorSheet({
		buildChanges,
		apply: onApply,
		onClose,
		validate,
	});

	return {
		access: {
			rows: accessRows,
			rowVersions,
			getId: getBulkRepoRowId,
			columns: accessColumns,
			preselected: accessPreselected,
			selection: accessSelection,
			setSelection: setAccessSelection,
			selected: selectedAccesses,
			removeSelected: removeSelectedAccesses,
			addSelectedToAll: addSelectedAccessesToAll,
			isApplyToAllDisabled: isAccessApplyToAllDisabled,
			searchColumnId: repoColumnId,
			picker: {
				...accessPickerState,
				picked: addPickedAccesses,
			},
		},
		user: {
			show: !hasSystemOrSso,
			rows: userRows,
			getId: getBulkUserRowId,
			columns: userColumns,
			preselected: userPreselected,
			selection: userSelection,
			setSelection: setUserSelection,
			selected: selectedUsers,
			removeSelected: removeSelectedUsers,
			addSelectedToAll: addSelectedUsersToAll,
			searchColumnId: userColumnId,
			picker: {
				...userPickerState,
				picked: addPickedUsers,
			},
			ssoEnabled: ssoUsersEnabled,
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
