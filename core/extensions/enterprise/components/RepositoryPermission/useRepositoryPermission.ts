import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAccessSnapshot } from "@ext/enterprise/components/admin/settings/members/hooks/useAccessSnapshot";
import type { GesRepo } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { getResourceId } from "@ext/enterprise/components/RepositoryPermission/getResourceId";
import type { GesErrorCode } from "@ext/enterprise/errors/GesError";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseRepositoryPermissionArgs {
	pathName: string;
	sourceName: string;
	catalogName: string;
	onClose: () => void;
}

type RepositoryPermissionView =
	| { status: "loading" }
	| { status: "error"; code: GesErrorCode }
	| { status: "ready"; repo: GesRepo };

export const useRepositoryPermission = (args: UseRepositoryPermissionArgs) => {
	const { pathName, sourceName, catalogName, onClose } = args;
	const { ensureLoaded, isInitialLoading, isRefreshing, getTabError } = useSettings();

	const [isOpen, setIsOpen] = useState(true);
	const [isDirty, setDirty] = useState(false);
	const [showUnsaved, setShowUnsaved] = useState(false);

	const tabError = getTabError("resources") || getTabError("groups");
	const isTabsLoading =
		isInitialLoading("resources") ||
		isInitialLoading("groups") ||
		isRefreshing("resources") ||
		isRefreshing("groups");

	const {
		aggregate,
		applyAndSave,
		isLoading: isSnapshotLoading,
	} = useAccessSnapshot({
		enabled: !isTabsLoading && !tabError,
	});

	const resourceId = useMemo(
		() => getResourceId(pathName, sourceName, catalogName),
		[pathName, sourceName, catalogName],
	);
	const repo = useMemo(() => aggregate.repoById.get(resourceId), [aggregate.repoById, resourceId]);

	const view = useMemo((): RepositoryPermissionView => {
		if (tabError) return { status: "error", code: tabError };
		if (repo) return { status: "ready", repo };
		if (isTabsLoading || isSnapshotLoading) return { status: "loading" };
		return { status: "error", code: "not-found" };
	}, [tabError, isTabsLoading, isSnapshotLoading, repo]);

	const reload = useCallback(() => {
		ensureLoaded("resources", true);
		ensureLoaded("groups", true);
	}, [ensureLoaded]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
	useEffect(() => {
		ensureLoaded("resources");
		ensureLoaded("groups");
	}, []);

	const close = useCallback(() => {
		setIsOpen(false);
		onClose();
	}, [onClose]);

	const requestClose = useCallback(() => {
		if (isDirty) setShowUnsaved(true);
		else close();
	}, [isDirty, close]);

	return {
		view,
		aggregate,
		isOpen,
		showUnsaved,
		setShowUnsaved,
		setDirty,
		applyAndSave,
		reload,
		requestClose,
		close,
	};
};
