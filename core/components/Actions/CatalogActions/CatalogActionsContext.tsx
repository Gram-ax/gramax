import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import type { MenuContext } from "@gramax/sdk/ui";
import assert from "assert";
import { createContext, ReactNode, SetStateAction, useCallback, useContext, useMemo } from "react";

export interface CatalogActionsContextValue {
	catalogName: string;
	sourceName?: string;
	pathName?: string;
	gesUrl?: string;

	canConfigure: boolean;
	hasSource: boolean;
	hasGesUrl: boolean;
	isArticleExist: boolean;
	isAiEnabled: boolean;
	renderDeleteCatalog: boolean;
	isMac: boolean;
	isReadOnly: boolean;
	cloudServiceUrl?: string;
	itemLinks: ItemLink[];
	onToggleTab: (tab: LeftNavigationTab) => void;
	pluginContext: MenuContext;
}

const CatalogActionsContext = createContext<CatalogActionsContextValue | null>(null);

export function useCatalogActionsContext(): CatalogActionsContextValue {
	const context = useContext(CatalogActionsContext);
	assert(context, "useCatalogActionsContext must be used within CatalogActionsProvider");

	return context;
}

interface CatalogActionsProviderProps {
	children: ReactNode;
	itemLinks: ItemLink[];
	currentTab: LeftNavigationTab;
	setCurrentTab: (tab: SetStateAction<LeftNavigationTab>) => void;
	renderDeleteCatalog: boolean;
}

export function CatalogActionsProvider({
	children,
	itemLinks,
	currentTab,
	setCurrentTab,
	renderDeleteCatalog,
}: CatalogActionsProviderProps) {
	const pageData = PageDataContextService.value;
	const workspacePath = WorkspaceService.current()?.path;

	const { catalogName, sourceName, pathName } = useCatalogPropsStore(
		(state) => ({
			catalogName: state.data.name,
			sourceName: state.data.sourceName,
			pathName: state.data?.link?.pathname,
		}),
		"shallow",
	);

	const isStorageConnected = useIsStorageConnected();
	const canEditCatalog = PermissionService.useCheckPermission(editCatalogPermission, workspacePath);
	const canConfigureNewCatalog = canEditCatalog && !isStorageConnected;
	const canConfigure = canEditCatalog || canConfigureNewCatalog;

	const gesUrl = pageData.conf.enterprise.gesUrl;
	const hasSource = !!sourceName;
	const hasGesUrl = !!gesUrl;
	const isArticleExist = !!itemLinks.length;
	const isAiEnabled = pageData.conf.ai.enabled;
	const isMac = IsMacService.value;
	const isReadOnly = pageData.conf.isReadOnly;
	const cloudServiceUrl = pageData.conf.cloudServiceUrl;

	const onToggleTab = useCallback(
		(tab: LeftNavigationTab) => {
			setCurrentTab(tab === currentTab ? LeftNavigationTab.None : tab);
		},
		[currentTab, setCurrentTab],
	);

	const pluginContext: MenuContext = useMemo(
		() => ({
			catalogName,
			sourceName,
			pathName,
			isReadOnly,
			canConfigureCatalog: canConfigure,
			cloudServiceUrl,
			isArticleExist,
			isAiEnabled,
			workspacePath,
		}),
		[
			catalogName,
			sourceName,
			pathName,
			isReadOnly,
			canConfigure,
			cloudServiceUrl,
			isArticleExist,
			isAiEnabled,
			workspacePath,
		],
	);

	const value: CatalogActionsContextValue = {
		catalogName,
		sourceName,
		pathName,
		gesUrl,
		canConfigure,
		hasSource,
		hasGesUrl,
		isArticleExist,
		isAiEnabled,
		renderDeleteCatalog,
		isMac,
		isReadOnly,
		cloudServiceUrl,
		itemLinks,
		onToggleTab,
		pluginContext,
	};

	return <CatalogActionsContext.Provider value={value}>{children}</CatalogActionsContext.Provider>;
}
