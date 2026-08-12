import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { groupColumn, groupColumnId } from "@ext/enterprise/components/admin/settings/members/config/groupColumn";
import { guestColumn, guestColumnId } from "@ext/enterprise/components/admin/settings/members/config/guestColumn";
import { userColumn, userColumnId } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import {
	type BulkAccessRow,
	useBulkAccessDraft,
} from "@ext/enterprise/components/admin/settings/members/hooks/useBulkAccessDraft";
import { useEditorSheet } from "@ext/enterprise/components/admin/settings/members/hooks/useEditorSheet";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import {
	type GesRepo,
	type GroupMember,
	type GuestMember,
	getBulkGroupRowId,
	getBulkGuestRowId,
	getBulkUserRowId,
	getGroupRowId,
	getGuestRowId,
	getRepoRowId,
	getUserRowId,
	type MemberAggregate,
	type RepoGroupAccess,
	type RepoGuestAccess,
	type RepoUserAccess,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import {
	isMixedRole,
	MIXED_ROLE,
	useBulkRepoUserRoleRules,
	useGroupRoleRules,
	useGuestRoleRules,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { buildBulkRepoChanges } from "@ext/enterprise/components/admin/settings/resources/model/buildBulkRepoChanges";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { deepEqual } from "@ext/enterprise/utils/deepEqual";
import { useCallback, useMemo } from "react";

interface UseBulkRepoCardArgs {
	repos: GesRepo[];
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const useBulkRepoCard = (args: UseBulkRepoCardArgs) => {
	const { repos, aggregate, onApply, onClose } = args;

	const { settings, ssoUsersEnabled } = useSettings();

	const groupPickerState = useOpenState({ keyBase: "group" });
	const userPickerState = useOpenState({ keyBase: "user" });
	const guestPickerState = useOpenState({ keyBase: "guest" });

	const { roleRules: groupRoleRules } = useGroupRoleRules();

	const groupBulkAccessRows = useMemo(() => {
		const res = new Map<string, BulkAccessRow<GroupMember, GesRepo>>();
		for (const repo of repos) {
			const groupAccess = aggregate.repoAccesses.get(repo.id)?.groups ?? [];
			for (const ga of groupAccess) {
				let ex = res.get(ga.group.id);
				if (!ex) {
					ex = {
						ent: ga.group,
						role: ga.role,
						containers: new Map(),
					};
					res.set(ga.group.id, ex);
				}

				if (ex.role !== ga.role) {
					ex.role = MIXED_ROLE;
				}

				ex.containers.set(repo.id, {
					cont: repo,
					role: ga.role,
				});
			}
		}

		return res;
	}, [repos, aggregate.repoAccesses]);

	const {
		rows: groupRows,
		rowVersions: groupRowVersions,
		columns: groupBaseColumns,
		remove: removeGroupRepos,
		add: addGroupAccesses,
		applyToAll: addGroupsToAll,
		validate: validateGroups,
	} = useBulkAccessDraft({
		initial: groupBulkAccessRows,
		allContainers: repos,
		getEntId: getGroupRowId,
		getContId: getRepoRowId,
		roleRules: groupRoleRules,
	});

	const groupColumns = useMemo(
		() => [
			groupColumn<BulkAccessRow<GroupMember, GesRepo>>({
				getId: (row) => row.ent.id,
				getLabel: (row) => row.ent.name,
				getSource: (row) => row.ent.source,
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

	const groupPreselected = useMemo(() => new Set(groupRows.map((r) => r.ent.id)), [groupRows]);

	const removeSelectedGroups = useCallback(() => {
		removeGroupRepos(selectedGroups.map((x) => x.ent.id));
	}, [selectedGroups, removeGroupRepos]);

	const addSelectedGroupsToAll = useCallback(() => {
		addGroupsToAll(selectedGroups);
	}, [selectedGroups, addGroupsToAll]);

	const isGroupApplyToAllDisabled = useMemo(
		() =>
			selectedGroups.some((row) => {
				const role = isMixedRole(row.role) ? "reader" : row.role;
				return Boolean(groupRoleRules.disabledReason(role));
			}),
		[selectedGroups, groupRoleRules],
	);

	const addPickedGroups = useCallback(
		(picked: RepoGroupAccess[]) => {
			addGroupAccesses(picked.map((p) => ({ ent: p.group, role: p.role })));
		},
		[addGroupAccesses],
	);

	const { roleRules: userRoleRules } = useBulkRepoUserRoleRules();

	const userBulkAccessRows = useMemo(() => {
		const res = new Map<string, BulkAccessRow<UserMember, GesRepo>>();
		for (const repo of repos) {
			const userAccess = aggregate.repoAccesses.get(repo.id)?.users ?? [];
			for (const ua of userAccess) {
				let ex = res.get(ua.user.value);
				if (!ex) {
					ex = {
						ent: ua.user,
						role: ua.role,
						branches: ua.branches,
						containers: new Map(),
					};
					res.set(ua.user.value, ex);
				}

				if (ex.role !== ua.role) {
					ex.role = MIXED_ROLE;
				}

				if (!deepEqual(ex.branches, ua.branches)) {
					ex.branches = undefined;
				}

				ex.containers.set(repo.id, {
					cont: repo,
					role: ua.role,
					branches: ua.branches,
				});
			}
		}

		return res;
	}, [repos, aggregate.repoAccesses]);

	const {
		rows: userRows,
		rowVersions: userRowVersions,
		columns: userBaseColumns,
		remove: removeUserRepos,
		add: addUserAccesses,
		applyToAll: addUsersToAll,
	} = useBulkAccessDraft({
		initial: userBulkAccessRows,
		allContainers: repos,
		getEntId: getUserRowId,
		getContId: getRepoRowId,
		roleRules: userRoleRules,
	});

	const userColumns = useMemo(
		() => [
			userColumn<BulkAccessRow<UserMember, GesRepo>>({
				getName: (row) => row.ent.value,
				isEditor: (row) => row.ent.isEditor,
				isWorkspaceOwner: (row) => row.ent.isWorkspaceOwner,
			}),
			...userBaseColumns,
		],
		[userBaseColumns],
	);

	const {
		rowSelection: userSelection,
		setRowSelection: setUserSelection,
		selectedRows: selectedUsers,
	} = useRowSelectionWithData(userRows, getBulkUserRowId);

	const userPreselected = useMemo(() => new Set(userRows.map((r) => r.ent.value)), [userRows]);

	const removeSelectedUsers = useCallback(() => {
		removeUserRepos(selectedUsers.map((x) => x.ent.value));
	}, [selectedUsers, removeUserRepos]);

	const addSelectedUsersToAll = useCallback(() => {
		addUsersToAll(selectedUsers);
	}, [selectedUsers, addUsersToAll]);

	const isUserApplyToAllDisabled = useMemo(
		() =>
			selectedUsers.some((row) => {
				const role = isMixedRole(row.role) ? "reader" : row.role;
				return Boolean(userRoleRules.disabledReason(role));
			}),
		[selectedUsers, userRoleRules],
	);

	const addPickedUsers = useCallback(
		(picked: RepoUserAccess[]) => {
			addUserAccesses(picked.map((x) => ({ ent: x.user, role: x.role, branches: x.branches })));
		},
		[addUserAccesses],
	);

	const { roleRules: guestRoleRules } = useGuestRoleRules();

	const guestBulkAccessRows = useMemo(() => {
		const res = new Map<string, BulkAccessRow<GuestMember, GesRepo>>();
		for (const repo of repos) {
			const guestAccess = aggregate.repoAccesses.get(repo.id)?.guests ?? [];
			for (const ga of guestAccess) {
				let ex = res.get(ga.guest.value);
				if (!ex) {
					ex = {
						ent: ga.guest,
						role: ga.role,
						containers: new Map(),
					};
					res.set(ga.guest.value, ex);
				}

				if (ex.role !== ga.role) {
					ex.role = MIXED_ROLE;
				}

				ex.containers.set(repo.id, {
					cont: repo,
					role: ga.role,
				});
			}
		}

		return res;
	}, [repos, aggregate.repoAccesses]);

	const {
		rows: guestRows,
		rowVersions: guestRowVersions,
		columns: guestBaseColumns,
		remove: removeGuestRepos,
		add: addGuestAccesses,
		applyToAll: addGuestsToAll,
		validate: validateGuests,
	} = useBulkAccessDraft({
		initial: guestBulkAccessRows,
		allContainers: repos,
		getEntId: getGuestRowId,
		getContId: getRepoRowId,
		roleRules: guestRoleRules,
	});

	const guestColumns = useMemo(
		() => [
			guestColumn<BulkAccessRow<GuestMember, GesRepo>>({
				getName: (row) => row.ent.value,
			}),
			...guestBaseColumns,
		],
		[guestBaseColumns],
	);

	const {
		rowSelection: guestSelection,
		setRowSelection: setGuestSelection,
		selectedRows: selectedGuests,
	} = useRowSelectionWithData(guestRows, getBulkGuestRowId);

	const guestPreselected = useMemo(() => new Set(guestRows.map((r) => r.ent.value)), [guestRows]);

	const removeSelectedGuests = useCallback(() => {
		removeGuestRepos(selectedGuests.map((x) => x.ent.value));
	}, [selectedGuests, removeGuestRepos]);

	const addSelectedGuestsToAll = useCallback(() => {
		addGuestsToAll(selectedGuests);
	}, [selectedGuests, addGuestsToAll]);

	const isGuestApplyToAllDisabled = useMemo(
		() =>
			selectedGuests.some((row) => {
				const role = isMixedRole(row.role) ? "reader" : row.role;
				return Boolean(guestRoleRules.disabledReason(role));
			}),
		[selectedGuests, guestRoleRules],
	);

	const addPickedGuests = useCallback(
		(picked: RepoGuestAccess[]) => {
			addGuestAccesses(picked.map((p) => ({ ent: p.guest, role: p.role })));
		},
		[addGuestAccesses],
	);

	const buildChanges = useCallback(() => {
		return buildBulkRepoChanges({
			repos,
			draftGroups: groupRows,
			draftGuests: guestRows,
			draftUsers: userRows,
			origAccesses: aggregate.repoAccesses,
		});
	}, [repos, aggregate.repoAccesses, groupRows, guestRows, userRows]);

	const validate = useCallback(() => {
		return validateGroups() && validateGuests();
	}, [validateGroups, validateGuests]);

	const { saving, saveError, showUnsaved, setShowUnsaved, requestClose, persist, submit, close } = useEditorSheet({
		buildChanges,
		apply: onApply,
		onClose,
		validate,
	});

	return {
		group: {
			rows: groupRows,
			rowVersions: groupRowVersions,
			getId: getBulkGroupRowId,
			columns: groupColumns,
			preselected: groupPreselected,
			selection: groupSelection,
			setSelection: setGroupSelection,
			selected: selectedGroups,
			add: addPickedGroups,
			removeSelected: removeSelectedGroups,
			addSelectedToAll: addSelectedGroupsToAll,
			isApplyToAllDisabled: isGroupApplyToAllDisabled,
			searchColumnId: groupColumnId,
			picker: {
				...groupPickerState,
				picked: addPickedGroups,
			},
		},
		user: {
			rows: userRows,
			rowVersions: userRowVersions,
			getId: getBulkUserRowId,
			columns: userColumns,
			preselected: userPreselected,
			selection: userSelection,
			setSelection: setUserSelection,
			selected: selectedUsers,
			removeSelected: removeSelectedUsers,
			addSelectedToAll: addSelectedUsersToAll,
			isApplyToAllDisabled: isUserApplyToAllDisabled,
			searchColumnId: userColumnId,
			picker: {
				...userPickerState,
				picked: addPickedUsers,
			},
			ssoEnabled: ssoUsersEnabled,
		},
		guest: {
			rows: guestRows,
			rowVersions: guestRowVersions,
			getId: getBulkGuestRowId,
			columns: guestColumns,
			preselected: guestPreselected,
			selection: guestSelection,
			setSelection: setGuestSelection,
			selected: selectedGuests,
			removeSelected: removeSelectedGuests,
			addSelectedToAll: addSelectedGuestsToAll,
			isApplyToAllDisabled: isGuestApplyToAllDisabled,
			searchColumnId: guestColumnId,
			picker: {
				...guestPickerState,
				picked: addPickedGuests,
			},
			domain: {
				whitelistEnabled: settings?.guests?.whitelistEnabled,
				whitelist: settings?.guests?.domains,
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
	};
};
