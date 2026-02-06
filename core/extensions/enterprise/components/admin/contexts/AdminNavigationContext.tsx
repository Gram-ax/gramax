import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import assert from "assert";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

export interface PluginDetailParams {
	selectedPluginId: string;
}

export interface UserGroupsParams {
	entityId: string;
}

export interface ResourcesParams {
	groupId: string;
	repositoryId?: string;
}

export type PageParams = {
	[Page.PLUGIN_DETAIL]: PluginDetailParams;
	[Page.USER_GROUPS]: UserGroupsParams;
	[Page.STYLEGUIDE]: undefined;
	[Page.QUIZ]: undefined;
	[Page.EDITORS]: undefined;
	[Page.WORKSPACE]: undefined;
	[Page.RESOURCES]: ResourcesParams;
	[Page.MAIL]: undefined;
	[Page.GUESTS]: undefined;
	[Page.PLUGINS]: undefined;
	[Page.METRICS]: undefined;
	[Page.VIEW_METRICS]: undefined;
	[Page.SEARCH_METRICS]: undefined;
};

const getDefaultPageParams = (): Partial<PageParams> => ({
	[Page.PLUGIN_DETAIL]: { selectedPluginId: "" },
	[Page.USER_GROUPS]: { entityId: "" },
	[Page.RESOURCES]: { groupId: "" },
});
interface AdminNavigationContextValue {
	page: Page;
	pageParams: PageParams[Page];
	navigate: <P extends Page>(page: P, params?: PageParams[P]) => void;
	getPageParams: <P extends Page>(page: P) => PageParams[P] | undefined;
}

const AdminNavigationContext = createContext<AdminNavigationContextValue | undefined>(undefined);

interface AdminNavigationProviderProps {
	children: ReactNode;
	initialPage?: Page;
}

export const AdminNavigationProvider = ({ children, initialPage = Page.WORKSPACE }: AdminNavigationProviderProps) => {
	const [page, setPage] = useState<Page>(initialPage);
	const [pageParams, setPageParams] = useState<PageParams[Page]>(undefined);

	const navigate = useCallback(<P extends Page>(newPage: P, params?: PageParams[P]) => {
		setPage(newPage);
		setPageParams(params || getDefaultPageParams()[newPage]);
	}, []);

	const getPageParams = useCallback(
		<P extends Page>(targetPage: P): PageParams[P] | undefined => {
			if (page === targetPage) {
				return pageParams as PageParams[P];
			}
			return undefined;
		},
		[page, pageParams],
	);

	const value = {
		page,
		pageParams,
		navigate,
		getPageParams,
	};

	return <AdminNavigationContext.Provider value={value}>{children}</AdminNavigationContext.Provider>;
};

export const useAdminNavigation = <P extends Page>(targetPage?: P) => {
	const context = useContext(AdminNavigationContext);

	assert(context, "useAdminNavigation must be used within AdminNavigationProvider");

	const pageParams = targetPage ? context.getPageParams(targetPage) : undefined;

	return {
		navigate: context.navigate,
		pageParams: pageParams as PageParams[P] | undefined,
		page: context.page,
	};
};
