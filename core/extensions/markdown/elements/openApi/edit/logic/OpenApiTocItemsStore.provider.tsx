import type React from "react";
import { createContext, useContext, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { createOpenApiTocItemsStore, type OpenApiTocItemsStore } from "./OpenApiTocItemsStore";

const StoreContext = createContext<ResourceStoreApi>(null);
export type ResourceStoreApi = ReturnType<typeof createOpenApiTocItemsStore>;

export const OpenApiTocItemsStoreProvider = ({ children }: { children: React.ReactNode }) => {
	const storeRef = useRef<ResourceStoreApi>();

	if (!storeRef.current) {
		storeRef.current = createOpenApiTocItemsStore();
	}

	return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
};

export const useOpenApiTocItemsStore = <T,>(selector: (store: OpenApiTocItemsStore) => T): T => {
	const storeContext = useContext(StoreContext);
	if (!storeContext) return selector({ data: undefined } as OpenApiTocItemsStore);
	return useStoreWithEqualityFn(storeContext, selector, shallow);
};
