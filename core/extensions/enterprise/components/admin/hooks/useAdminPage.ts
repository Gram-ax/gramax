import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useGuard } from "@ext/enterprise/components/admin/contexts/GuardProvider";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { adminPageDescriptors } from "@ext/enterprise/model/AdminPageModel";
import type { Page } from "@ext/enterprise/types/Page";
import { useCallback, useRef } from "react";

export type AdminNavigateFunction = (nextPage: Page, params?: { selectedPluginId: string }) => Promise<void>;

export const useAdminPage = () => {
	const { settings, globalError, reloadGlobal, ensureLoaded } = useSettings();

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
			void adminPageDescriptors[nextPage]?.loader({ ensureLoaded });
			navigate(nextPage, params);
		},
		[page, getGuard, navigate, showUnsavedChangesModal, ensureLoaded],
	);

	const retry = useCallback(async () => {
		await Promise.all([
			reloadGlobal(),
			adminPageDescriptors[page]?.loader({ ensureLoaded: (tab) => ensureLoaded(tab, true) }),
		]);
	}, [page, reloadGlobal, ensureLoaded]);

	return {
		settings,
		globalError,
		retry,
		tryNavigate,
		scrollContainerRef,
		pageParams,
		page,
	};
};
