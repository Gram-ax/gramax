import useWatch from "@core-ui/hooks/useWatch";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { ModuleOptions } from "@ext/enterprise/types/UserSettings";
import { createContext, useContext, memo, useRef } from "react";
import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

interface AdminPageParams {
	tabId?: string;
	entityId?: string;
	groupId?: string;
	repositoryId?: string;
}

const DEFAULT_PAGE_PARAMS: AdminPageParams = {
	tabId: "",
	entityId: "",
	groupId: "",
	repositoryId: "",
};

export type TabGuard = {
	hasChanges: () => boolean;
	onSave: () => void | Promise<void>;
	onDiscard?: () => void | Promise<void>;
};

interface AdminPageDataProviderProps {
	children: React.ReactNode;
}

interface AdminPageDataStore {
	page: Page;
	modules: ModuleOptions;
	params: AdminPageParams;
	setPage: (page: Page) => void;
	setParams: (params: AdminPageParams) => void;
	setModules: (modules: ModuleOptions) => void;
	tabGuards: Partial<Record<Page, TabGuard>>;
	setTabGuard: (page: Page, guard: TabGuard | null) => void;
}

const createAdminPageDataStore = () =>
	create<AdminPageDataStore>((set, get) => ({
		page: Page.WORKSPACE,
		modules: { quiz: false, styleGuide: false },
		params: DEFAULT_PAGE_PARAMS,
		setPage: (page) => set({ page }),
		setParams: (params) => set({ params: { ...get().params, ...params } }),
		setModules: (modules) => set({ modules }),
		tabGuards: {},
		setTabGuard: (page, guard) =>
			set((prev) => {
				const next = { ...prev.tabGuards };
				if (guard) next[page] = guard;
				else delete next[page];
				return { ...prev, tabGuards: next };
			}),
	}));

export type AdminPageDataStoreApi = ReturnType<typeof createAdminPageDataStore>;

export const AdminPageDataContext = createContext<AdminPageDataStoreApi>(null);

export const useAdminPageData = <T,>(
	selector: (store: AdminPageDataStore) => T,
	equalityFn?: (a: T, b: T) => boolean,
): T => {
	const adminPageDataContext = useContext(AdminPageDataContext);

	if (adminPageDataContext === null)
		throw new Error("useAdminPageDataStore must be used within AdminPageDataProvider");
	return useStoreWithEqualityFn(adminPageDataContext, selector, equalityFn);
};

const ChildrenOfProvider = ({ children }: AdminPageDataProviderProps) => {
	const { page, setParams } = useAdminPageData(
		(store) => ({ page: store.page, setParams: store.setParams }),
		shallow,
	);

	useWatch(() => {
		if (!setParams) return;
		setParams(DEFAULT_PAGE_PARAMS);
	}, [page]);

	return children;
};

export const AdminPageDataProvider = memo(({ children }: AdminPageDataProviderProps) => {
	const storeRef = useRef<AdminPageDataStoreApi>(null);

	if (!storeRef.current) {
		storeRef.current = createAdminPageDataStore();
	}

	return (
		<AdminPageDataContext.Provider value={storeRef.current}>
			<ChildrenOfProvider>{children}</ChildrenOfProvider>
		</AdminPageDataContext.Provider>
	);
});
