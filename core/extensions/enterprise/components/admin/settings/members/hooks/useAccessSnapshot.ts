import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useCachedLookup } from "@ext/enterprise/components/admin/settings/members/hooks/useCachedLookup";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import {
	type AccessSnapshot,
	applyAccessChanges,
} from "@ext/enterprise/components/admin/settings/members/model/applyAccessChanges";
import {
	buildMemberAggregate,
	emptyAggregate,
} from "@ext/enterprise/components/admin/settings/members/model/buildMemberAggregate";
import { flushAccessDraft } from "@ext/enterprise/components/admin/settings/members/model/flushAccessDraft";
import { emailKey, type MemberAggregate } from "@ext/enterprise/components/admin/settings/members/model/Member";
import type { searchGroupInfo, searchUserInfo } from "@ext/enterprise/EnterpriseService";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseAccessSnapshotArgs {
	enabled: boolean;
}

const getUserEmail = (x: searchUserInfo) => x.email;
const getGroupId = (x: searchGroupInfo) => x.id;

export const useAccessSnapshot = (args: UseAccessSnapshotArgs) => {
	const { enabled } = args;
	const settingsCtx = useSettings();
	const { settings, searchUsersByEmails, searchGroupsByIds, ssoGroupsEnabled, ssoUsersEnabled } = settingsCtx;

	const [pendingChanges, setPendingChanges] = useState<AccessChange[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isDirty, setDirty] = useState(false);

	const base = useMemo<AccessSnapshot>(() => {
		if (!enabled)
			return {
				resources: [],
				groups: {},
			};
		return {
			resources: settings?.resources ?? [],
			groups: settings?.groups ?? {},
			editors: settings?.editors,
			workspace: settings?.workspace,
		};
	}, [settings?.resources, settings?.groups, settings?.editors, settings?.workspace, enabled]);

	const draft = useMemo(() => {
		if (pendingChanges.length === 0) return base;
		return applyAccessChanges(base, pendingChanges);
	}, [base, pendingChanges]);

	const applyChanges = useCallback((changes: AccessChange[]) => {
		if (changes.length === 0) return;
		setPendingChanges((prev) => [...prev, ...changes]);
		setDirty(true);
	}, []);

	const [aggregate, setAggregate] = useState<MemberAggregate>(() => emptyAggregate());

	const lookupUsers = useCachedLookup(searchUsersByEmails, getUserEmail, emailKey);
	const lookupGroups = useCachedLookup(searchGroupsByIds, getGroupId);

	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		setIsLoading(true);
		buildMemberAggregate({
			draft,
			searchGroupsByIds: ssoGroupsEnabled ? lookupGroups : undefined,
			searchUsersByEmails: ssoUsersEnabled ? lookupUsers : undefined,
		})
			.then((a) => {
				if (!cancelled) setAggregate(a);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [draft, lookupGroups, lookupUsers, enabled, ssoGroupsEnabled, ssoUsersEnabled]);

	const flush = useCallback(
		async (c: AccessChange[]) => {
			setIsSaving(true);
			try {
				const draft = applyAccessChanges(base, c);
				await flushAccessDraft(base, draft, settingsCtx);
				setDirty(false);
			} finally {
				setIsSaving(false);
			}
		},
		[base, settingsCtx],
	);

	const handleSave = useCallback(async () => {
		await flush(pendingChanges);
	}, [flush, pendingChanges]);

	const handleDiscard = useCallback(() => {
		setPendingChanges([]);
		setDirty(false);
	}, []);

	const applyAndSave = useCallback(
		async (c?: AccessChange[]) => {
			await flush([...pendingChanges, ...(c ?? [])]);
		},
		[flush, pendingChanges],
	);

	return {
		aggregate,
		draft,
		isLoading,
		isDirty,
		isSaving,
		isSaveDisabled: !isDirty || isSaving,
		applyChanges,
		applyAndSave,
		onSave: handleSave,
		onDiscard: handleDiscard,
	};
};
