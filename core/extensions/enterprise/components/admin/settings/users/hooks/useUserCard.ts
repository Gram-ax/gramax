import validateEmail from "@core/utils/validateEmail";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { groupBadgesColumn } from "@ext/enterprise/components/admin/settings/members/config/groupBadgesColumn";
import { groupColumn, groupColumnId } from "@ext/enterprise/components/admin/settings/members/config/groupColumn";
import { useEditorSheet } from "@ext/enterprise/components/admin/settings/members/hooks/useEditorSheet";
import { useLinkedItems } from "@ext/enterprise/components/admin/settings/members/hooks/useLinkedItems";
import { useMemberAccessDraft } from "@ext/enterprise/components/admin/settings/members/hooks/useMemberAccessDraft";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import {
	emailKey,
	type GroupMember,
	getAccessRowId,
	getGroupRowId,
	type MemberAccess,
	type MemberAggregate,
	type UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useUserRoleRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { repoColumnId } from "@ext/enterprise/components/admin/settings/resources/model/repoColumn";
import { buildUserChanges } from "@ext/enterprise/components/admin/settings/users/model/buildUserChanges";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseUserCardArgs {
	user?: UserMember | null;
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const useUserCard = ({ user, aggregate, onApply, onClose }: UseUserCardArgs) => {
	const isAdd = !user;
	const { ssoUsersEnabled } = useSettings();
	const [email, setEmail] = useState(user?.value ?? "");
	const [emailError, setEmailError] = useState<string | null>(null);
	const [isEditor, setIsEditor] = useState(Boolean(user?.isEditor));
	const wasWorkspaceOwner = user?.isWorkspaceOwner ?? false;
	const [isOwner, setIsOwner] = useState(wasWorkspaceOwner);
	const sheetError = useAlertMessage();
	const [submitAttempted, setSubmitAttempted] = useState(false);

	const accessPickerState = useOpenState({ keyBase: "access" });
	const groupPickerState = useOpenState({ keyBase: "group" });

	const handleSetIsEditor = useCallback((val: boolean) => {
		setIsEditor(val);
		if (!val) setIsOwner(false);
	}, []);

	const wasEditor = Boolean(user?.isEditor);
	const editorSlotsFull = !wasEditor && aggregate.editors.length >= aggregate.editorsCount;

	const effectiveEditorsUsed = useMemo(() => {
		const base = wasEditor ? aggregate.editors.length - 1 : aggregate.editors.length;
		return isEditor ? base + 1 : base;
	}, [isEditor, aggregate.editors.length, wasEditor]);

	const { roleRules } = useUserRoleRules();
	const originalAccesses = useMemo(
		() => (user ? (aggregate.userAccesses.get(emailKey(user.value)) ?? []) : []),
		[user, aggregate],
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
		return new Set(accessRows.map((x) => x.resourceId));
	}, [accessRows]);

	const {
		rowSelection: accessSelection,
		setRowSelection: setAccessSelection,
		selectedRows: selectedAccesses,
	} = useRowSelectionWithData(accessRows, getAccessRowId);

	const removeSelectedAccesses = useCallback(() => {
		removeAccesses(selectedAccesses);
	}, [selectedAccesses, removeAccesses]);

	const originalGroups = useMemo(
		() => (user ? (aggregate.userToGroups.get(emailKey(user.value)) ?? []) : []),
		[user, aggregate],
	);

	const [groupRowsMap, setGroupRowsMap] = useState(() => {
		const res = new Map<string, GroupMember>();
		originalGroups.forEach((x) => {
			const group = aggregate.groupsById.get(x);
			if (!group) return;
			res.set(group.id, group);
		});
		return res;
	});

	const {
		rows: groupRows,
		add: addGroups,
		remove: removeGroups,
	} = useLinkedItems({
		rowsMap: groupRowsMap,
		setRowsMap: setGroupRowsMap,
		getId: getGroupRowId,
	});

	const groupsColumns = useMemo<ColumnDef<GroupMember>[]>(
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

	const groupPreselected = useMemo(() => new Set(groupRows.map((x) => x.id)), [groupRows]);

	const {
		rowSelection: groupSelection,
		setRowSelection: setGroupSelection,
		selectedRows: selectedGroups,
	} = useRowSelectionWithData(groupRows, getGroupRowId);

	const removeSelectedGroups = useCallback(() => {
		removeGroups(selectedGroups.map((x) => x.id));
	}, [selectedGroups, removeGroups]);

	const buildChanges = useCallback(() => {
		return buildUserChanges({
			isAdd,
			email: email,
			isEditor,
			wasEditor,
			editorsList: aggregate.editors.map((x) => x.value),
			accesses: accessRows,
			originalAccesses,
			groups: groupRows.map((x) => x.id),
			originalGroups: originalGroups,
			isWorkspaceOwner: isOwner,
			wasWorkspaceOwner,
		});
	}, [
		accessRows,
		aggregate.editors,
		isAdd,
		isEditor,
		isOwner,
		wasWorkspaceOwner,
		groupRows,
		originalAccesses,
		originalGroups,
		wasEditor,
		email,
	]);

	const isDuplicate = useCallback(
		(id: string) => {
			const key = emailKey(id.trim());
			if (!key || key === emailKey(user?.value ?? "")) return false;
			return aggregate.usersByValue.has(key);
		},
		[aggregate.usersByValue, user],
	);

	const validateEmailField = useCallback(
		(id: string) => {
			const trimmed = id.trim();
			if (!trimmed) return t("enterprise.admin.errors.email-required");
			if (!validateEmail(trimmed)) return t("enterprise.admin.errors.email-invalid");
			if (isDuplicate(trimmed)) return t("enterprise.admin.users.errors.exists");
			return null;
		},
		[isDuplicate],
	);

	const handleEmailBlur = useCallback(() => {
		const err = validateEmailField(email);
		setEmailError(err);
	}, [email, validateEmailField]);

	const handleEmailChange = useCallback(
		(val: string) => {
			setEmail(val);
			if (submitAttempted) {
				const err = validateEmailField(val);
				setEmailError(err);
			}
		},
		[submitAttempted, validateEmailField],
	);

	const needsAccess = !user?.isSso && !isEditor && accessRows.length === 0 && groupRows.length === 0;

	useEffect(() => {
		if (sheetError.isShown && !needsAccess) {
			sheetError.hide();
		}
	}, [sheetError.hide, sheetError.isShown, needsAccess]);

	const validate = useCallback(async () => {
		const emailErr = validateEmailField(email);
		setEmailError(emailErr);
		const accessesValid = validateAccesses();
		let sheetErrored = false;
		if (needsAccess && !ssoUsersEnabled) {
			sheetError.alert(t("enterprise.admin.users.errors.needs-access"));
			sheetErrored = true;
		}
		const valid = !emailErr && !sheetErrored && accessesValid;
		if (!valid) setSubmitAttempted(true);
		return valid;
	}, [email, needsAccess, validateEmailField, validateAccesses, ssoUsersEnabled, sheetError.alert]);

	const { saving, saveError, showUnsaved, setShowUnsaved, requestClose, persist, submit, close } = useEditorSheet({
		buildChanges,
		apply: onApply,
		onClose,
		validate,
	});

	return {
		data: {
			email,
			setEmail: handleEmailChange,
			emailError,
			onEmailBlur: handleEmailBlur,
			isEditor,
			setIsEditor: handleSetIsEditor,
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
			selected: selectedAccesses,
			removeSelected: removeSelectedAccesses,
			searchColumnId: repoColumnId,
			picker: {
				...accessPickerState,
				picked: addAccesses,
			},
		},
		group: {
			rows: groupRows,
			getId: getGroupRowId,
			columns: groupsColumns,
			preselected: groupPreselected,
			selection: groupSelection,
			setSelection: setGroupSelection,
			selected: selectedGroups,
			removeSelected: removeSelectedGroups,
			searchColumnId: groupColumnId,
			picker: {
				...groupPickerState,
				picked: addGroups,
			},
		},
		form: {
			submit,
			persist,
			close,
			sheetError,
			saveError,
			saving,
			showUnsaved,
			setShowUnsaved,
			requestClose,
		},
		aggregate,
		isAdd,
		roleRules,
		editorSlotsFull,
		editorCount: aggregate.editorsCount,
		effectiveEditorsUsed,
	};
};
