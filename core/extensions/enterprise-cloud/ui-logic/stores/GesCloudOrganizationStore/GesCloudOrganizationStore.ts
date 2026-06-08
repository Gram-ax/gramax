import type { GesCloudApi, OrganizationInfo } from "@ext/enterprise-cloud/GesCloudApi";
import { createStore } from "zustand";

export interface GesCloudOrganizationStore {
	organizations: OrganizationInfo[];
	isLoading: boolean;
	error: string | null;
	fetchOrganizationsFromApi: (api: GesCloudApi) => Promise<void>;
	setOrganizations: (organizations: OrganizationInfo[]) => void;
	clearAll: () => void;
}

const defaultInitState = {
	organizations: [] as OrganizationInfo[],
	isLoading: false,
	error: null as string | null,
};

export const createGesCloudOrganizationStore = (initState = defaultInitState) => {
	return createStore<GesCloudOrganizationStore>()((set) => ({
		...initState,

		fetchOrganizationsFromApi: async (api: GesCloudApi) => {
			set({ isLoading: true, error: null });

			try {
				const organizations = await api.getUserOrganizations();
				set({ organizations, isLoading: false });
			} catch (error) {
				set({
					error: error instanceof Error ? error.message : "Failed to fetch organizations from API",
					isLoading: false,
				});
			}
		},

		setOrganizations: (organizations: OrganizationInfo[]) => {
			set({ organizations });
		},

		clearAll: () => {
			set({ organizations: [], error: null });
		},
	}));
};
