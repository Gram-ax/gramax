import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useConfigLoaders } from "@ext/enterprise/components/admin/hooks/useConfigLoaders";
import { type UpdatePayloads, useConfigUpdaters } from "@ext/enterprise/components/admin/hooks/useConfigUpdaters";
import { useSearchMetrics } from "@ext/enterprise/components/admin/hooks/useSearchMetrics";
import type { GroupValue } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { AnonymousFilter } from "@ext/enterprise/components/admin/settings/metrics/filters";
import type { ArticleRatingsResponse } from "@ext/enterprise/components/admin/settings/metrics/search/ratings/ArticleRatingsTableConfig";
import type { SearchTableDataResponse } from "@ext/enterprise/components/admin/settings/metrics/search/table/SearchMetricsTableConfig";
import type {
	ChartDataPoint,
	MetricsCatalogsResponse,
	MetricsUsersResponse,
	SearchQueryDetailsResponse,
	TableDataResponse,
} from "@ext/enterprise/components/admin/settings/metrics/types";
import type { QuizTableFilters } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTableControls";
import type {
	QuizTest,
	QuizTestData,
	SearchedAnsweredUsers,
	SearchedQuizTest,
} from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import type {
	RequestCursor,
	RequestData,
} from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable/LazyInfinityTable";
import type EnterpriseService from "@ext/enterprise/EnterpriseService";
import type { searchGroupInfo, searchUserInfo } from "@ext/enterprise/EnterpriseService";
import { type GesErrorCode, toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { type LoadableTab, type Settings, type TabKey, tabKeys } from "@ext/enterprise/types/EnterpriseAdmin";
import type { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import type { CheckChunk, CheckOverrideSettings, CheckSuggestion } from "@ics/gx-vector-search";
import type { PluginConfig } from "@plugins/types";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type SettingsState = Partial<Settings>;

type BuiltInModulesSettings = Pick<SettingsState, "styleGuide" | "quiz">;
interface BuiltInPluginDefinition {
	id: string;
	icon: string;
	navigateTo: string;
	getSettings: (settings: BuiltInModulesSettings) => BuiltInModulesSettings[keyof BuiltInModulesSettings] | undefined;
}

export const BUILT_IN_PLUGIN_DEFINITIONS: BuiltInPluginDefinition[] = [
	{
		id: "styleGuide",
		icon: "file-check2",
		navigateTo: "styleGuide",
		getSettings: (settings: SettingsState) => settings?.styleGuide,
	},
	{
		id: "quiz",
		icon: "file-question-mark",
		navigateTo: "quiz",
		getSettings: (settings: SettingsState) => settings?.quiz,
	},
];

const makeTabKeyMap = <T,>(val: T) => Object.fromEntries(tabKeys.map((t) => [t, val])) as Record<TabKey, T>;

const GIT_RESOURCES_PAGE_SIZE = 100;

const loadAllGitResources = async (enterpriseService: EnterpriseService, token: string): Promise<string[]> => {
	const acc: string[] = [];
	for (let pageNum = 1; ; pageNum++) {
		const { repos } = await enterpriseService.getResources(token, pageNum);
		acc.push(...(repos ?? []));
		if (!repos || repos.length < GIT_RESOURCES_PAGE_SIZE) return acc;
	}
};

export type SettingsContextType = {
	settings: Readonly<SettingsState>;
	global: { allGitResources: string[] };
	gesUrl: string;
	globalError: GesErrorCode | null;
	reloadGlobal: () => Promise<void>;
	ssoUsersEnabled: boolean;
	ssoGroupsEnabled: boolean;
	update: <K extends keyof UpdatePayloads>(tab: K, value: UpdatePayloads[K]) => Promise<void>;
	addGroup: (group: { groupId: string; groupValue: GroupValue[]; groupName?: string }) => Promise<void>;
	deleteGroups: (groupIds: string[]) => Promise<void>;
	renameGroup: (groupId: string, newName: string) => Promise<void>;
	addResource: (resource: ResourcesSettings) => Promise<void>;
	deleteResources: (resourceIds: string[]) => Promise<void>;
	checkStyleGuide: (
		chunks: CheckChunk[],
		providers: ["languageTool" | "llm"],
		overrideSettings?: CheckOverrideSettings,
		checkSpelling?: boolean,
		signal?: AbortSignal,
	) => Promise<CheckSuggestion[]>;
	healthcheckStyleGuide: () => Promise<boolean>;
	healthcheckDataProvider: () => Promise<boolean>;
	searchUsers: (query: string) => Promise<searchUserInfo[]>;
	searchUsersByEmails: (emails: string[]) => Promise<searchUserInfo[]>;
	searchGroups: (query: string) => Promise<searchGroupInfo[]>;
	searchGroupsByIds: (ids: string[]) => Promise<searchGroupInfo[]>;
	searchBranches: (repoName: string) => Promise<string[]>;
	getQuizUsersAnswers: (
		cursor: RequestCursor,
		limit: number,
		filters: QuizTableFilters,
	) => Promise<RequestData<QuizTest>>;
	getQuizDetailedUserAnswers: (testId: number) => Promise<QuizTestData>;
	searchQuizTests: (query: string) => Promise<SearchedQuizTest[]>;
	searchAnsweredUsers: (query: string) => Promise<SearchedAnsweredUsers[]>;
	getMetricsTableData: (
		cursor?: number,
		startDate?: string,
		endDate?: string,
		sortBy?: string,
		sortOrder?: string,
		userEmails?: string[],
		anonymousFilter?: AnonymousFilter,
		catalogFilter?: string[],
	) => Promise<TableDataResponse | null>;
	loadFilteredChartData: (
		startDate: string,
		endDate: string,
		articleIds?: number[],
		userEmails?: string[],
		anonymousFilter?: AnonymousFilter,
		catalogFilter?: string[],
	) => Promise<ChartDataPoint[] | null>;
	getMetricsUsers: (search?: string, limit?: number, cursor?: number) => Promise<MetricsUsersResponse | null>;
	getMetricsCatalogs: (search?: string, limit?: number, cursor?: number) => Promise<MetricsCatalogsResponse | null>;
	getSearchMetricsCatalogs: (
		search?: string,
		limit?: number,
		cursor?: number,
	) => Promise<MetricsCatalogsResponse | null>;
	ensureLoaded: (tab: LoadableTab, force?: boolean) => Promise<void>;
	getSearchTableData: (
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	) => Promise<SearchTableDataResponse | null>;
	getSearchQueryDetails: (
		query: string,
		startDate: string,
		endDate: string,
		cursor?: number,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	) => Promise<SearchQueryDetailsResponse | null>;
	getArticleRatings: (
		startDate: string,
		endDate: string,
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
		catalogFilter?: string[],
	) => Promise<ArticleRatingsResponse | null>;
	isInitialLoading: (tab: TabKey) => boolean;
	isRefreshing: (tab: TabKey) => boolean;
	getTabError: (tab: TabKey) => GesErrorCode | null;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

type SettingsProviderProps = {
	children: ReactNode;
	enterpriseService: EnterpriseService;
	token: string;
};

export function SettingsProvider({ children, enterpriseService, token }: SettingsProviderProps) {
	const sourceDatas = SourceDataService.value;

	const [settings, setSettings] = useState<SettingsState>({});
	const [globalError, setGlobalError] = useState<GesErrorCode | null>(null);
	const [hasUsers, setHasUsers] = useState(false);
	const [hasGroups, setHasGroups] = useState(false);
	const [allGitResources, setAllGitResources] = useState<string[]>([]);
	const [initialLoading, setInitialLoading] = useState<Record<TabKey, boolean>>(makeTabKeyMap(true));
	const [refreshing, setRefreshing] = useState<Record<TabKey, boolean>>(makeTabKeyMap(false));
	const [tabErrors, setTabErrors] = useState<Record<TabKey, GesErrorCode | null>>(
		makeTabKeyMap<GesErrorCode | null>(null),
	);

	const { ensureLoaded } = useConfigLoaders({
		enterpriseService,
		setInitialLoading,
		setRefreshing,
		setSettings,
		setTabErrors,
		settings,
		token,
	});

	const { update, addGroup, deleteGroups, renameGroup, addResource, deleteResources } = useConfigUpdaters({
		enterpriseService,
		setSettings,
		settings,
		token,
	});

	const {
		getMetricsTableData,
		loadFilteredChartData,
		getSearchTableData,
		getSearchQueryDetails,
		getArticleRatings,
		getMetricsUsers,
		getMetricsCatalogs,
		getSearchMetricsCatalogs,
	} = useSearchMetrics({
		enterpriseService,
		setRefreshing,
		setTabErrors,
		settings,
		token,
	});

	const isInitialLoading = useCallback((tab: TabKey) => initialLoading[tab], [initialLoading]);
	const isRefreshing = useCallback((tab: TabKey) => refreshing[tab], [refreshing]);
	const getTabError = useCallback((tab: TabKey) => tabErrors[tab], [tabErrors]);

	const loadGlobal = useCallback(async () => {
		setGlobalError(null);
		const onError = (e: unknown) => setGlobalError(toGesErrorCode(e));
		await Promise.all([
			enterpriseService.checkConnector().then(setHasUsers, onError),
			enterpriseService.checkGroupsConnector().then(setHasGroups, onError),
			loadAllGitResources(enterpriseService, token).then(setAllGitResources, onError),
		]);
	}, [enterpriseService, token]);

	useEffect(() => {
		void loadGlobal();
	}, [loadGlobal]);

	const healthcheckStyleGuide = useCallback(async () => {
		return await enterpriseService.checkStyleGuideHealth();
	}, [enterpriseService]);

	const healthcheckDataProvider = useCallback(async () => {
		return await enterpriseService.checkDataProviderHealth();
	}, [enterpriseService]);

	const checkStyleGuide = useCallback(
		async (
			chunks: CheckChunk[],
			providers: ["languageTool" | "llm"],
			overrideSettings?: CheckOverrideSettings,
			checkSpelling?: boolean,
			signal?: AbortSignal,
		) => {
			try {
				return await enterpriseService.checkStyleGuide(
					chunks,
					providers,
					overrideSettings,
					checkSpelling,
					signal,
				);
			} catch (e) {
				console.error("Failed to check style guide example", e);
				throw e;
			}
		},
		[enterpriseService],
	);

	const getQuizUsersAnswers = async (
		cursor: RequestCursor,
		limit: number,
		filters?: QuizTableFilters,
	): Promise<RequestData<QuizTest>> => {
		return await enterpriseService.getQuizUsersAnswers(token, limit, cursor, filters);
	};

	const searchQuizTests = async (query: string): Promise<SearchedQuizTest[]> => {
		return await enterpriseService.searchQuizTest(token, query);
	};

	const searchAnsweredUsers = async (query: string): Promise<SearchedAnsweredUsers[]> => {
		return await enterpriseService.searchQuizAnsweredUsers(token, query);
	};

	const getQuizDetailedUserAnswers = async (testId: number): Promise<QuizTestData> => {
		return await enterpriseService.getQuizDetailedUserAnswers(token, testId);
	};

	const searchUsers = useCallback(
		async (query: string): Promise<searchUserInfo[]> => {
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, enterpriseService.getGesUrl());
			return enterpriseService.getUsers(query, enterpriseSource?.token ?? "");
		},
		[enterpriseService],
	);

	const searchUsersByEmails = useCallback(
		async (emails: string[]): Promise<searchUserInfo[]> => {
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, enterpriseService.getGesUrl());
			return enterpriseService.getUsersByEmails(emails, enterpriseSource?.token ?? "");
		},
		[enterpriseService],
	);

	const searchGroups = useCallback(
		async (query: string): Promise<searchGroupInfo[]> => {
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, enterpriseService.getGesUrl());
			return enterpriseService.getGroups(query, enterpriseSource?.token ?? "");
		},
		[enterpriseService],
	);

	const searchGroupsByIds = useCallback(
		async (ids: string[]): Promise<searchGroupInfo[]> => {
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, enterpriseService.getGesUrl());
			return enterpriseService.getGroupsByIds(ids, enterpriseSource?.token ?? "");
		},
		[enterpriseService],
	);

	const searchBranches = useCallback(
		async (repoName: string): Promise<string[]> => {
			try {
				return await enterpriseService.getBranches(token, repoName);
			} catch {
				return [];
			}
		},
		[enterpriseService, token],
	);

	const settingsWithBuiltInModules = useMemo((): SettingsState => {
		const modulePlugins: PluginConfig[] = BUILT_IN_PLUGIN_DEFINITIONS.map((def) => {
			const currentSettings = def.getSettings(settings);
			const isEnabled = currentSettings?.enabled ?? false;

			return {
				metadata: {
					...def,
					name: getAdminPageTitle(def.id as Page),
					version: "-",
					entryPoint: "",
					disabled: !isEnabled,
					isBuiltIn: true,
					onSave: async (newSettings: BuiltInModulesSettings[keyof BuiltInModulesSettings]) => {
						await update(def.id as "styleGuide" | "quiz", newSettings);
					},
				},
				script: "",
			};
		});
		const customPlugins = settings?.plugins?.plugins ?? [];

		return {
			...settings,
			plugins: {
				plugins: [...modulePlugins, ...customPlugins],
			},
		};
	}, [settings, update]);

	return (
		<SettingsContext.Provider
			value={{
				settings: settingsWithBuiltInModules,
				global: { allGitResources },
				gesUrl: enterpriseService.getGesUrl(),
				globalError,
				reloadGlobal: loadGlobal,
				ssoUsersEnabled: hasUsers,
				ssoGroupsEnabled: hasGroups,
				update,
				checkStyleGuide,
				addGroup,
				deleteGroups,
				renameGroup,
				addResource,
				deleteResources,
				searchUsers,
				searchUsersByEmails,
				searchGroups,
				searchGroupsByIds,
				searchBranches,
				ensureLoaded,
				healthcheckStyleGuide,
				healthcheckDataProvider,
				searchAnsweredUsers,
				getQuizUsersAnswers,
				getQuizDetailedUserAnswers,
				getMetricsTableData,
				loadFilteredChartData,
				getSearchTableData,
				getSearchQueryDetails,
				getArticleRatings,
				getMetricsUsers,
				getMetricsCatalogs,
				getSearchMetricsCatalogs,
				searchQuizTests,
				isInitialLoading,
				isRefreshing,
				getTabError,
			}}
		>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}
