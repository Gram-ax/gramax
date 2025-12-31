import { CatalogPropsStore, createCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { type ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export type CatalogStoreApi = ReturnType<typeof createCatalogPropsStore>;

export const CatalogStoreContext = createContext<CatalogStoreApi | undefined>(undefined);

export interface CatalogStoreProviderProps {
	children: ReactNode;
	data: ClientCatalogProps;
}

export const CatalogStoreProvider = ({ children, data }: CatalogStoreProviderProps) => {
	const storeRef = useRef<CatalogStoreApi>(null);
	if (storeRef.current === null) {
		storeRef.current = createCatalogPropsStore({ data });
	}

	useEffect(() => {
		storeRef.current?.setState({ data });
	}, [data]);

	return <CatalogStoreContext.Provider value={storeRef.current}>{children}</CatalogStoreContext.Provider>;
};

export const useCatalogPropsStore = <T,>(
	selector: (store: CatalogPropsStore) => T,
	equalityFn?: ((a: T, b: T) => boolean) | "shallow",
): T => {
	const catalogStoreContext = useContext(CatalogStoreContext);

	if (!catalogStoreContext) {
		// Made for compatibility with the previous version of the context, which was called outside its context
		// Ideally, this should be investigated and fixed
		return selector({ data: undefined } as CatalogPropsStore);
	}

	const actualEqualityFn = equalityFn === "shallow" ? shallow : equalityFn;

	return useStoreWithEqualityFn(catalogStoreContext, selector, actualEqualityFn);
};

