import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useGuard } from "@ext/enterprise/components/admin/hooks/useGuard";
import { getPageDataLoader } from "@ext/enterprise/components/admin/utils/pageDataLoaders";
import type { Page } from "@ext/enterprise/types/Page";
import { useCallback, useEffect, useRef } from "react";

export type AdminNavigateFunction = (nextPage: Page, params?: { selectedPluginId: string }) => Promise<void>;

export const useWorkspaceEditorOptions = () => {
	const {
		settings,
		error,
		ensureGroupsLoaded,
		ensureMailLoaded,
		ensureGuestsLoaded,
		ensureWorkspaceLoaded,
		ensureEditorsLoaded,
		ensureResourcesLoaded,
		ensureStyleGuideLoaded,
		ensureQuizLoaded,
		ensurePluginsLoaded,
		ensureMetricsLoaded,
		ensureSearchMetricsLoaded,
	} = useSettings();

	const { page, pageParams, navigate } = useAdminNavigation();
	const { getGuard, showUnsavedChangesModal } = useGuard();
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const tryNavigate = useCallback<AdminNavigateFunction>(
		async (nextPage: Page, params?: { selectedPluginId: string }) => {
			if (nextPage === page) return;
			const currentGuard = getGuard(page);
			if (currentGuard?.hasChanges()) {
				showUnsavedChangesModal(
					currentGuard,
					() => navigate(nextPage, params),
					() => navigate(nextPage, params),
				);
				return;
			}
			navigate(nextPage, params);
		},
		[page, getGuard, navigate, showUnsavedChangesModal],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: fix later
	useEffect(() => {
		const loadData = getPageDataLoader(page);

		void loadData?.({
			ensureWorkspaceLoaded,
			ensureGroupsLoaded,
			ensureEditorsLoaded,
			ensureResourcesLoaded,
			ensureMailLoaded,
			ensureGuestsLoaded,
			ensureStyleGuideLoaded,
			ensureQuizLoaded,
			ensurePluginsLoaded,
			ensureMetricsLoaded,
			ensureSearchMetricsLoaded,
		});
	}, [page]);

	return {
		settings,
		error,
		tryNavigate,
		scrollContainerRef,
		pageParams,
		page,
	};
};
