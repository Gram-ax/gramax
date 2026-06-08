import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import {
	createGesCloudOrganizationStore,
	type GesCloudOrganizationStore,
} from "@ext/enterprise-cloud/ui-logic/stores/GesCloudOrganizationStore/GesCloudOrganizationStore";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export type GesCloudOrganizationStoreApi = ReturnType<typeof createGesCloudOrganizationStore>;

export const GesCloudOrganizationStoreContext = createContext<GesCloudOrganizationStoreApi | undefined>(undefined);

export interface GesCloudOrganizationStoreProviderProps {
	children: ReactNode;
	gesCloudUrl?: string;
}

export const GesCloudOrganizationStoreProvider = ({
	children,
	gesCloudUrl,
}: GesCloudOrganizationStoreProviderProps) => {
	const storeRef = useRef<GesCloudOrganizationStoreApi>(null);
	if (storeRef.current === null) {
		storeRef.current = createGesCloudOrganizationStore();
	}

	useEffect(() => {
		if (gesCloudUrl) {
			const api = new GesCloudApi(gesCloudUrl);
			storeRef.current?.getState().fetchOrganizationsFromApi(api);
		} else {
			storeRef.current?.getState().setOrganizations([]);
		}
	}, [gesCloudUrl]);

	return (
		<GesCloudOrganizationStoreContext.Provider value={storeRef.current}>
			{children}
		</GesCloudOrganizationStoreContext.Provider>
	);
};

export const useGesCloudOrganizationStore = <T,>(selector: (store: GesCloudOrganizationStore) => T): T => {
	const storeContext = useContext(GesCloudOrganizationStoreContext);

	if (!storeContext) {
		throw new Error("useGesCloudOrganizationStore must be used within GesCloudOrganizationStoreProvider");
	}

	return useStoreWithEqualityFn(storeContext, selector, shallow);
};
