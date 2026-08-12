import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { buildGroupChanges } from "@ext/enterprise/components/admin/settings/groups/model/buildGroupChanges";
import { nameColumn } from "@ext/enterprise/components/admin/settings/members/config/nameColumn";
import { userBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/userBadgesColumn";
import { userColumn, userColumnId } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import { useEditorSheet } from "@ext/enterprise/components/admin/settings/members/hooks/useEditorSheet";
import { useLinkedItems } from "@ext/enterprise/components/admin/settings/members/hooks/useLinkedItems";
import { useMemberAccessDraft } from "@ext/enterprise/components/admin/settings/members/hooks/useMemberAccessDraft";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import {
	emailKey,
	type GroupMember,
	getAccessRowId,
	getUserRowId,
	isSystemGroup,
	type MemberAccess,
	type MemberAggregate,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useGroupRoleRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { repoColumnId } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useMemo, useState } from "react";

interface UseGroupCardArgs {
	group?: GroupMember;
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const useGroupCard = ({ group, aggregate, onApply, onClose }: UseGroupCardArgs) => {
	const isAdd = !group;
	const isSystemOrSso = !isAdd && (!group || isSystemGroup(group));

	const { ssoUsersEnabled } = useSettings();

	const [name, setName] = useState(group?.name ?? "");
	const [nameError, setNameError] = useState<string | null>(null);
	const [submitAttempted, setSubmitAttempted] = useState(false);

	const wasWorkspaceOwner = group?.isWorkspaceOwner ?? false;
	const [isOwner, setIsOwner] = useState(wasWorkspaceOwner);
	const groupId = isAdd ? name : group.id;

	const accessPickerState = useOpenState({ keyBase: "access" });
	const userPickerState = useOpenState({ keyBase: "user" });

	const { roleRules } = useGroupRoleRules();
	const originalAccesses = useMemo(
		() => (group ? (aggregate.groupAccesses.get(group.id) ?? []) : []),
		[group, aggregate],
	);

	const [accessRowsMap, setAccessRowsMap] = useState(() => {
		const res = new Map<string, MemberAccess>();
		originalAccesses.forEach((x) => {
			res.set(x.resourceId, x);
		});
		return res;
	});

	const {
		remove: removeAccesses,
		add: addAccesses,
		columns: accessColumns,
		validate: validateAccesses,
		rowVersions: accessRowVersions,
	} = useMemberAccessDraft({
		rowsMap: accessRowsMap,
		setRowsMap: setAccessRowsMap,
		roleRules,
	});

	const accessRows = useMemo(() => [...accessRowsMap.values()], [accessRowsMap]);

	const accessPreselected = useMemo(() => {
		return new Set(accessRows.map((a) => a.resourceId));
	}, [accessRows]);

	const {
		rowSelection: accessSelection,
		setRowSelection: setAccessSelection,
		selectedRows: accessSelected,
	} = useRowSelectionWithData(accessRows, getAccessRowId);

	const removeSelectedAccesses = useCallback(() => {
		removeAccesses(accessSelected);
	}, [accessSelected, removeAccesses]);

	const originalUserEmails = useMemo(
		() => (group ? (aggregate.groupToUsers.get(group.id) ?? []) : []),
		[group, aggregate.groupToUsers],
	);

	const [userRowsMap, setUserRowsMap] = useState(() => {
		const origUsers = originalUserEmails.map((x) => aggregate.usersByValue.get(emailKey(x))).filter(Boolean);
		return new Map(origUsers.map((x) => [x.value, x]));
	});

	const {
		rows: userRows,
		add: addUsers,
		remove: removeUsers,
	} = useLinkedItems({
		rowsMap: userRowsMap,
		setRowsMap: setUserRowsMap,
		getId: getUserRowId,
	});

	const userPreselected = useMemo(() => new Set(userRows.map((x) => x.value)), [userRows]);

	const {
		rowSelection: userSelection,
		setRowSelection: setUserSelection,
		selectedIds: userSelctedIds,
		selectedRows: userSelected,
	} = useRowSelectionWithData(userRows, getUserRowId);

	const removeSelectedUsers = useCallback(() => {
		removeUsers(userSelctedIds);
	}, [userSelctedIds, removeUsers]);

	const userColumns = useMemo<ColumnDef<UserMember>[]>(
		() => [
			userColumn({
				header: t("email"),
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

	const buildChanges = useCallback(() => {
		return buildGroupChanges({
			isAdd,
			id: groupId,
			name: name,
			source: group?.source ?? GroupSource.GX_GROUPS,
			accesses: accessRows,
			originalAccesses: originalAccesses,
			users: userRows.map((x) => x.value),
			originalUsers: originalUserEmails,
			isWorkspaceOwner: isOwner,
			wasWorkspaceOwner,
		});
	}, [
		accessRows,
		isAdd,
		userRows,
		groupId,
		originalAccesses,
		originalUserEmails,
		isOwner,
		wasWorkspaceOwner,
		group?.source,
		name,
	]);

	const isDuplicate = useCallback(
		(id: string) => {
			const trimmed = id.trim();
			if (!trimmed || trimmed === group?.id) return false;
			return aggregate.groupsById.has(trimmed);
		},
		[aggregate.groupsById, group?.id],
	);

	const validateName = useCallback(
		(id: string) => {
			const trimmed = id.trim();
			if (!trimmed) return t("enterprise.admin.groups.errors.name-required");
			if (isDuplicate(trimmed)) return t("enterprise.admin.groups.errors.exists");
			return null;
		},
		[isDuplicate],
	);

	const handleNameBlur = useCallback(() => {
		const err = validateName(name);
		setNameError(err);
	}, [name, validateName]);

	const handleNameChange = useCallback(
		(val: string) => {
			setName(val);
			if (submitAttempted) {
				const err = validateName(val);
				setNameError(err);
			}
		},
		[submitAttempted, validateName],
	);

	const validate = useCallback(async () => {
		const err = validateName(name);
		setNameError(err);
		const accessesValid = validateAccesses();
		const valid = !err && accessesValid;
		if (!valid) setSubmitAttempted(true);
		return valid;
	}, [validateName, name, validateAccesses]);

	const { saving, saveError, showUnsaved, setShowUnsaved, requestClose, persist, submit, close } = useEditorSheet({
		buildChanges,
		apply: onApply,
		onClose,
		validate,
	});

	return {
		data: {
			name,
			setName: handleNameChange,
			nameError,
			onNameBlur: handleNameBlur,
			nameReadonly: !isAdd,
			isWorkspaceOwner: isOwner,
			setWorkspaceOwner: setIsOwner,
		},
		access: {
			rows: accessRows,
			rowVersions: accessRowVersions,
			getId: getAccessRowId,
			columns: accessColumns,
			preselected: accessPreselected,
			selection: accessSelection,
			setSelection: setAccessSelection,
			selected: accessSelected,
			removeSelected: removeSelectedAccesses,
			searchColumnId: repoColumnId,
			picker: {
				...accessPickerState,
				picked: addAccesses,
			},
		},
		user: {
			show: !isSystemOrSso,
			rows: userRows,
			getId: getUserRowId,
			columns: userColumns,
			preselected: userPreselected,
			selection: userSelection,
			setSelection: setUserSelection,
			selected: userSelected,
			removeSelected: removeSelectedUsers,
			searchColumnId: userColumnId,
			picker: {
				...userPickerState,
				picked: addUsers,
			},
			ssoEnabled: ssoUsersEnabled,
		},
		form: {
			saving,
			saveError,
			submit,
			persist,
			showUnsaved,
			setShowUnsaved,
			close,
			requestClose,
		},
		aggregate,
		isAdd,
		roleRules,
	};
};
