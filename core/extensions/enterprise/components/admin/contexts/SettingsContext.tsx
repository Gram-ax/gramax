import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import { useApi } from "@core-ui/hooks/useApi";
import type { GroupValue } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { type AnonymousFilter, loadMetricsFilters } from "@ext/enterprise/components/admin/settings/metrics/filters";
import type { ArticleRatingsResponse } from "@ext/enterprise/components/admin/settings/metrics/search/ratings/ArticleRatingsTableConfig";
import type { SearchTableDataResponse } from "@ext/enterprise/components/admin/settings/metrics/search/table/SearchMetricsTableConfig";
import type {
	ChartDataPoint,
	SearchChartDataPoint,
	SearchQueryDetailsResponse,
	TableDataResponse,
} from "@ext/enterprise/components/admin/settings/metrics/types";
import { getDateRangeForInterval, PAGE_SIZE } from "@ext/enterprise/components/admin/settings/metrics/utils";
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
import type { searchUserInfo } from "@ext/enterprise/EnterpriseService";
import type { Page, Settings } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import t from "@ext/localization/locale/translate";
import type { PluginConfig } from "@plugins/types";
import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export type SettingsState = Partial<Settings>;

type BuiltInModulesSettings = Pick<SettingsState, "styleGuide" | "quiz">;
export interface BuiltInPluginDefinition {
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

// Tab keys for per-tab loading/error isolation
export type TabKey =
	| "workspace"
	| "groups"
	| "editors"
	| "resources"
	| "mail"
	| "guests"
	| "styleGuide"
	| "quiz"
	| "plugins"
	| "metrics";

type SettingsContextType = {
	settings: Readonly<SettingsState>;
	global: { allGitResources: string[] };
	error: Error | null;
	users: string[] | null;
	hasUsers: boolean;
	updateEditors: (editors: Settings["editors"]) => Promise<void>;
	addGroup: (group: { groupId: string; groupValue: GroupValue[]; groupName?: string }) => Promise<void>;
	deleteGroups: (groupIds: string[]) => Promise<void>;
	renameGroup: (groupId: string, newName: string) => Promise<void>;
	updateGroup: (groupId: string, groupValue: GroupValue[], groupName: string) => Promise<void>;
	updateWorkspace: (workspace: Settings["workspace"]) => Promise<void>;
	addResource: (resource: ResourcesSettings) => Promise<void>;
	deleteResources: (resourceIds: string[]) => Promise<void>;
	updateMail: (mail: Settings["mailServer"]) => Promise<void>;
	updateGuests: (guests: Settings["guests"]) => Promise<void>;
	updatePlugins: (plugins: Settings["plugins"]) => Promise<void>;
	updateStyleGuide: (styleGuide: Settings["styleGuide"]) => Promise<void>;
	healthcheckStyleGuide: () => Promise<boolean>;
	healthcheckDataProvider: () => Promise<boolean>;
	searchUsers: (query: string) => Promise<searchUserInfo[]>;
	searchBranches: (repoName: string) => Promise<string[]>;
	updateQuiz: (quiz: Settings["quiz"]) => Promise<void>;
	updateMetrics: (metrics: { enabled: boolean }) => Promise<void>;
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
	) => Promise<TableDataResponse | null>;
	loadFilteredChartData: (
		startDate: string,
		endDate: string,
		articleIds?: number[],
		userEmails?: string[],
		anonymousFilter?: AnonymousFilter,
	) => Promise<ChartDataPoint[] | null>;
	getMetricsUsers: (
		search?: string,
		limit?: number,
		cursor?: number,
	) => Promise<{
		users: string[];
		hasMore: boolean;
		nextCursor: number | null;
	} | null>;
	// Per-tab loaders (ленивые)
	ensureWorkspaceLoaded: (force?: boolean) => Promise<void>;
	ensureMailLoaded: (force?: boolean) => Promise<void>;
	ensureGuestsLoaded: (force?: boolean) => Promise<void>;
	ensureGroupsLoaded: (force?: boolean) => Promise<void>;
	ensureResourcesLoaded: (force?: boolean) => Promise<void>;
	ensureEditorsLoaded: (force?: boolean) => Promise<void>;
	ensureStyleGuideLoaded: (force?: boolean) => Promise<void>;
	ensureQuizLoaded: (force?: boolean) => Promise<void>;
	ensurePluginsLoaded: (force?: boolean) => Promise<void>;
	ensureMetricsLoaded: () => Promise<void>;
	ensureSearchMetricsLoaded: () => Promise<void>;
	loadFilteredSearchChartData: (startDate: string, endDate: string) => Promise<SearchChartDataPoint[] | null>;
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
		cursor?: string,
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
	) => Promise<ArticleRatingsResponse | null>;
	// Tab-scoped loading/error selectors & utils
	isInitialLoading: (tab: TabKey) => boolean;
	isRefreshing: (tab: TabKey) => boolean;
	getTabError: (tab: TabKey) => Error | null;
	clearTabError: (tab: TabKey) => void;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

type SettingsProviderProps = {
	children: ReactNode;
	enterpriseService: EnterpriseService;
	token: string;
};

export function SettingsProvider({ children, enterpriseService, token }: SettingsProviderProps) {
	const [settings, setSettings] = useState<SettingsState>({});
	const [error, setError] = useState<Error | null>(null);
	const [users] = useState<string[] | null>(null);
	const [hasUsers, setHasUsers] = useState(false);
	const sourceDatas = SourceDataService.value;
	// ETags per tab
	const [mailEtag, setMailEtag] = useState<string | null>(null);
	const [guestsEtag, setGuestsEtag] = useState<string | null>(null);
	const [groupsEtag, setGroupsEtag] = useState<string | null>(null);
	const [editorsEtag, setEditorsEtag] = useState<string | null>(null);
	const [styleGuideETag, setStyleGuideEtag] = useState<string | null>(null);
	const [quizEtag, setQuizEtag] = useState<string | null>(null);
	const [metricsConfigEtag, setMetricsConfigEtag] = useState<string | null>(null);
	const [resourcesEtag, setResourcesEtag] = useState<string | null>(null);
	const [workspaceEtag, setWorkspaceEtag] = useState<string | null>(null);
	const [pluginsEtag, setPluginsEtag] = useState<string | null>(null);
	const [allGitResources, setAllGitResources] = useState<string[]>([]);

	const { refreshStyle, refreshHomeLogo } = WorkspaceAssetsService.value();

	const { call: refreshWorkspace } = useApi({
		url: (api) => api.refreshEnterpriseWorkspace(),
	});

	// Per-tab loading and error state
	const tabs: TabKey[] = [
		"workspace",
		"groups",
		"editors",
		"resources",
		"mail",
		"guests",
		"styleGuide",
		"quiz",
		"plugins",
		"metrics",
	];
	const makeBoolMap = (val: boolean) => Object.fromEntries(tabs.map((t) => [t, val])) as Record<TabKey, boolean>;

	const makeErrorMap = () => Object.fromEntries(tabs.map((t) => [t, null])) as Record<TabKey, Error | null>;

	const [initialLoading, setInitialLoading] = useState<Record<TabKey, boolean>>(makeBoolMap(true));
	const [refreshing, setRefreshing] = useState<Record<TabKey, boolean>>(makeBoolMap(false));
	const [tabErrors, setTabErrors] = useState<Record<TabKey, Error | null>>(makeErrorMap());

	const setFlag = useCallback(
		(setter: Dispatch<SetStateAction<Record<TabKey, boolean>>>, tab: TabKey, value: boolean) =>
			setter((prev) => ({ ...prev, [tab]: value })),
		[],
	);

	const setTabError = useCallback(
		(tab: TabKey, e: Error | null) => setTabErrors((prev) => ({ ...prev, [tab]: e })),
		[],
	);
	const clearTabError = useCallback((tab: TabKey) => setTabError(tab, null), [setTabError]);
	const isInitialLoading = (tab: TabKey) => initialLoading[tab];
	const isRefreshing = (tab: TabKey) => refreshing[tab];
	const getTabError = (tab: TabKey) => tabErrors[tab];

	async function withLoad<T>(tab: TabKey, hasData: boolean, fetcher: () => Promise<T>): Promise<T | undefined> {
		if (!hasData) setFlag(setInitialLoading, tab, true);
		else setFlag(setRefreshing, tab, true);
		try {
			clearTabError(tab);
			const res = await fetcher();
			return res;
		} catch (e) {
			setTabError(tab, (e as Error) ?? new Error("Unknown error"));
			return undefined;
		} finally {
			if (!hasData) setFlag(setInitialLoading, tab, false);
			else setFlag(setRefreshing, tab, false);
		}
	}

	const patch = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	}, []);

	const checkHasUsers = useCallback(async () => {
		try {
			const hasUsersCheck = await enterpriseService.checkConnector();
			setHasUsers(hasUsersCheck);
		} catch (e) {
			setError(e as Error);
		}
	}, [enterpriseService]);

	useEffect(() => {
		checkHasUsers();
	}, [checkHasUsers]);

	useEffect(() => {
		(async () => {
			let pageNum = 1;
			const pageSize = 100;
			let acc: string[] = [];

			while (true) {
				const res = await enterpriseService.getResources(token, pageNum);
				if (!res) break;

				const { repos } = res;
				acc = acc.concat(repos ?? []);
				pageNum++;

				if (!repos || repos.length < pageSize) break;
			}

			setAllGitResources(acc);
		})();
	}, [enterpriseService, token]);

	const ensureWorkspaceLoaded = async (force = false) => {
		await withLoad("workspace", Boolean(settings?.workspace), async () => {
			const { data, etag, notModified } = await enterpriseService.getWorkspaceConfig(
				token,
				force ? undefined : (workspaceEtag ?? undefined),
			);
			if (!notModified && data) patch("workspace", data);
			if (etag) setWorkspaceEtag(etag);
			return true as const;
		});
	};

	const ensureMailLoaded = async (force = false) => {
		await withLoad("mail", Boolean(settings?.mailServer), async () => {
			const { data, etag, notModified } = await enterpriseService.getMailConfig(
				token,
				force ? undefined : (mailEtag ?? undefined),
			);
			if (!notModified && data) patch("mailServer", data);
			if (etag) setMailEtag(etag);
			return true as const;
		});
	};

	const ensureGuestsLoaded = async (force = false) => {
		await withLoad("guests", Boolean(settings?.guests), async () => {
			const { data, etag, notModified } = await enterpriseService.getGuestsConfig(
				token,
				force ? undefined : (guestsEtag ?? undefined),
			);
			if (!notModified && data) patch("guests", data);
			if (etag) setGuestsEtag(etag);
			return true as const;
		});
	};

	const ensureResourcesLoaded = async (force = false) => {
		await withLoad("resources", Boolean(settings?.resources), async () => {
			const { data, etag, notModified } = await enterpriseService.getResourcesConfig(
				token,
				force ? undefined : (resourcesEtag ?? undefined),
			);
			if (!notModified && data) patch("resources", data);
			if (etag) setResourcesEtag(etag);
			return true as const;
		});
	};

	const ensureGroupsLoaded = async (force = false) => {
		await withLoad("groups", Boolean(settings?.groups), async () => {
			const { data, etag, notModified } = await enterpriseService.getGroupsConfig(
				token,
				force ? undefined : (groupsEtag ?? undefined),
			);
			if (!notModified && data) patch("groups", data);
			if (etag) setGroupsEtag(etag);
			return true as const;
		});
	};

	const ensureEditorsLoaded = async (force = false) => {
		await withLoad("editors", Boolean(settings?.editors), async () => {
			const { data, etag, notModified } = await enterpriseService.getEditorsConfig(
				token,
				force ? undefined : (editorsEtag ?? undefined),
			);
			if (!notModified && data) patch("editors", data);
			if (etag) setEditorsEtag(etag);
			return true as const;
		});
	};

	const ensureQuizLoaded = async (force = false) => {
		await withLoad("quiz", Boolean(settings?.quiz), async () => {
			const { data, etag, notModified } = await enterpriseService.getQuizConfig(
				token,
				force ? undefined : (quizEtag ?? undefined),
			);
			if (!notModified && data) patch("quiz", data);
			if (etag) setQuizEtag(etag);
			return true as const;
		});
	};

	const ensureStyleGuideLoaded = async (force = false) => {
		await withLoad("styleGuide", Boolean(settings?.styleGuide), async () => {
			const { data, etag, notModified } = await enterpriseService.getStyleGuideConfig(
				token,
				force ? undefined : (styleGuideETag ?? undefined),
			);
			if (!notModified && data) patch("styleGuide", data);
			if (etag) setStyleGuideEtag(etag);
			return true as const;
		});
	};

	const ensurePluginsLoaded = async (force = false) => {
		await withLoad("plugins", Boolean(settings?.plugins), async () => {
			const { data, etag, notModified } = await enterpriseService.getPluginsConfig(
				token,
				force ? undefined : (pluginsEtag ?? undefined),
			);
			if (!notModified && data) patch("plugins", data);
			if (etag) setPluginsEtag(etag);
			return true as const;
		});
	};

	const ensureMetricsLoaded = async () => {
		const filters = loadMetricsFilters();
		const { interval, startDate, endDate, selectedUserEmails, sortBy, sortOrder, anonymousFilter } = filters.view;
		await withLoad("metrics", Boolean(settings?.metrics), async () => {
			const [chartData, tableData, metricsConfigResult] = await Promise.all([
				enterpriseService.getMetricsChartData(
					token,
					startDate,
					endDate,
					undefined,
					selectedUserEmails,
					anonymousFilter,
				),
				enterpriseService.getMetricsTableData(
					token,
					startDate,
					endDate,
					PAGE_SIZE,
					undefined,
					sortBy,
					sortOrder,
					selectedUserEmails,
					anonymousFilter,
				),
				enterpriseService.getMetricsConfig(token, metricsConfigEtag ?? undefined),
			]);

			const metricsConfigEnabled = metricsConfigResult.data?.enabled ?? false;
			if (metricsConfigResult.etag) setMetricsConfigEtag(metricsConfigResult.etag);

			if (chartData && tableData) {
				patch("metrics", {
					chartData,
					tableData: tableData.data,
					hasMore: tableData.hasMore,
					nextCursor: tableData.nextCursor,
					interval,
					enabled: metricsConfigEnabled,
				});
			} else {
				patch("metrics", {
					...settings?.metrics,
					enabled: metricsConfigEnabled,
				} as Settings["metrics"]);
			}
			return true as const;
		});
	};

	const ensureSearchMetricsLoaded = async () => {
		const filters = loadMetricsFilters();
		const { interval, startDate, endDate, queriesTable, queriesDetailsTable, articleRatingTable } = filters.search;
		const { sortBy, sortOrder } = queriesTable;
		await withLoad("metrics", Boolean(settings?.searchMetrics), async () => {
			const [chartData, tableData, articleRatingsData] = await Promise.all([
				enterpriseService.getSearchMetricsChartData(token, startDate, endDate),
				enterpriseService.getSearchMetricsTableData(
					token,
					startDate,
					endDate,
					undefined,
					sortBy,
					sortOrder,
					25,
				),
				enterpriseService.getArticleRatings(
					token,
					startDate,
					endDate,
					undefined,
					articleRatingTable.sortBy,
					articleRatingTable.sortOrder,
				),
			]);

			const firstQuery = tableData?.data?.[0]?.normalizedQuery ?? null;
			let queryDetailsData = null;

			if (firstQuery) {
				queryDetailsData = await enterpriseService.getSearchQueryDetails(
					token,
					firstQuery,
					startDate,
					endDate,
					undefined,
					queriesDetailsTable.sortBy,
					queriesDetailsTable.sortOrder,
				);
			}
			if (chartData && tableData) {
				patch("searchMetrics", {
					chartData,
					tableData: tableData.data,
					hasMoreTableData: tableData.hasMore,
					nextTableCursor: tableData.nextCursor,
					interval,
					queryDetailsData: queryDetailsData?.data ?? [],
					hasMoreQueryDetails: queryDetailsData?.hasMore ?? false,
					nextQueryDetailsCursor: queryDetailsData?.nextCursor ?? null,
					selectedQuery: firstQuery,
					articleRatingsData: articleRatingsData?.data ?? [],
					hasMoreArticleRatings: articleRatingsData?.hasMore ?? false,
					nextArticleRatingsCursor: articleRatingsData?.nextCursor ?? null,
				});
			}
			return true as const;
		});
	};

	const loadFilteredSearchChartData = async (
		startDate: string,
		endDate: string,
	): Promise<SearchChartDataPoint[] | null> => {
		setFlag(setRefreshing, "metrics", true);
		try {
			const chartData = await enterpriseService.getSearchMetricsChartData(token, startDate, endDate);
			if (chartData && settings?.searchMetrics) {
				setSettings({
					...settings,
					searchMetrics: {
						...settings.searchMetrics,
						chartData,
					},
				});
			}
			return chartData;
		} catch (e) {
			setTabError("metrics", (e as Error) ?? new Error("Failed to load search chart data"));
			return null;
		} finally {
			setFlag(setRefreshing, "metrics", false);
		}
	};

	const loadFilteredChartData = async (
		startDate: string,
		endDate: string,
		articleIds?: number[],
		userEmails?: string[],
		anonymousFilter?: AnonymousFilter,
	): Promise<ChartDataPoint[] | null> => {
		setFlag(setRefreshing, "metrics", true);
		try {
			const chartData = await enterpriseService.getMetricsChartData(
				token,
				startDate,
				endDate,
				articleIds,
				userEmails,
				anonymousFilter,
			);
			return chartData;
		} catch (e) {
			setTabError("metrics", (e as Error) ?? new Error("Failed to load chart data"));
			return null;
		} finally {
			setFlag(setRefreshing, "metrics", false);
		}
	};

	const healthcheckStyleGuide = async () => {
		return await enterpriseService.checkStyleGuideHealth();
	};

	const healthcheckDataProvider = async () => {
		return await enterpriseService.checkDataProviderHealth();
	};

	const updateEditors = async (editors: Settings["editors"]) => {
		try {
			await enterpriseService.setEditors(token, editors);
			patch("editors", editors);
		} catch (e) {
			setTabError("editors", (e as Error) ?? new Error(t("enterprise.admin.editors.errors.update")));
			throw e;
		}
	};

	const addGroup = async (group: { groupId: string; groupValue: GroupValue[]; groupName?: string }) => {
		try {
			await enterpriseService.addGroup(token, group);
			await ensureGroupsLoaded(true);
		} catch (e) {
			setTabError("groups", (e as Error) ?? new Error(t("enterprise.admin.groups.errors.add")));
			throw e;
		}
	};

	const deleteGroups = async (groupIds: string[]) => {
		try {
			await enterpriseService.deleteGroups(token, groupIds);
			await ensureGroupsLoaded(true);
		} catch (e) {
			setTabError("groups", (e as Error) ?? new Error(t("enterprise.admin.groups.errors.delete")));
			throw e;
		}
	};

	const renameGroup = async (groupId: string, newName: string) => {
		try {
			await enterpriseService.renameGroup(token, groupId, newName);
			await ensureGroupsLoaded(true);
		} catch (e) {
			setTabError("groups", (e as Error) ?? new Error(t("enterprise.admin.groups.errors.rename")));
			throw e;
		}
	};

	const updateGroup = async (groupId: string, groupValue: GroupValue[], groupName: string) => {
		try {
			await enterpriseService.addGroup(token, {
				groupId,
				groupValue,
				groupName,
			});
			await ensureGroupsLoaded(true);
		} catch (e) {
			setTabError("groups", (e as Error) ?? new Error(t("enterprise.admin.groups.errors.add")));
			throw e;
		}
	};

	const updateWorkspace = async (workspace: Settings["workspace"]) => {
		try {
			await enterpriseService.setWorkspace(token, workspace);
			patch("workspace", workspace);
			await refreshWorkspace?.();
			refreshStyle?.();
			await refreshHomeLogo?.();
		} catch (e) {
			setTabError("workspace", (e as Error) ?? new Error(t("enterprise.admin.workspace.errors.update")));
			throw e;
		}
		patch("workspace", workspace);
	};

	const addResource = async (resource: ResourcesSettings) => {
		try {
			await enterpriseService.addResource(token, resource);
			await ensureResourcesLoaded(true);
		} catch (e) {
			setTabError("resources", (e as Error) ?? new Error(t("enterprise.admin.resources.errors.add")));
			throw e;
		}
	};

	const deleteResources = async (resourceIds: string[]) => {
		try {
			await enterpriseService.deleteResources(token, resourceIds);
			await ensureResourcesLoaded(true);
		} catch (e) {
			setTabError("resources", (e as Error) ?? new Error(t("enterprise.admin.resources.errors.delete")));
			throw e;
		}
	};

	const updateMail = async (mail: Settings["mailServer"]) => {
		try {
			await enterpriseService.setMail(token, mail);
			await ensureMailLoaded(true);
		} catch (e) {
			setTabError("mail", (e as Error) ?? new Error(t("enterprise.admin.mail.errors.update")));
			throw e;
		}
	};

	const updateGuests = async (guests: Settings["guests"]) => {
		try {
			await enterpriseService.setGuests(token, guests);
			patch("guests", guests);
		} catch (e) {
			setTabError("guests", (e as Error) ?? new Error(t("enterprise.admin.guests.errors.update")));
			throw e;
		}
	};

	const updateStyleGuide = useCallback(
		async (styleGuide: Settings["styleGuide"]) => {
			try {
				await enterpriseService.setStyleGuide(token, styleGuide);
				patch("styleGuide", styleGuide);
				await refreshWorkspace?.();
			} catch (e) {
				setTabError("styleGuide", (e as Error) ?? new Error(t("enterprise.admin.styleGuide.errors.update")));
				throw e;
			}
		},
		[enterpriseService, token, patch, refreshWorkspace, setTabError],
	);

	const updatePlugins = async (plugins: Settings["plugins"]) => {
		try {
			await enterpriseService.setPlugins(token, plugins);
			patch("plugins", plugins);
		} catch (e) {
			setTabError("plugins", (e as Error) ?? new Error("Failed to update plugins"));
			throw e;
		}
	};

	const updateQuiz = useCallback(
		async (quiz: Settings["quiz"]) => {
			try {
				await enterpriseService.setQuizConfig(token, quiz);
				patch("quiz", quiz);
				await refreshWorkspace?.();
			} catch (e) {
				setTabError("quiz", (e as Error) ?? new Error(t("enterprise.admin.quiz.errors.update")));
				throw e;
			}
		},
		[enterpriseService, token, patch, refreshWorkspace, setTabError],
	);

	const updateMetrics = useCallback(
		async (metricsConfig: { enabled: boolean }) => {
			try {
				await enterpriseService.setMetricsConfig(token, metricsConfig);
				patch("metrics", {
					...settings?.metrics,
					enabled: metricsConfig.enabled,
				} as Settings["metrics"]);
			} catch (e) {
				setTabError("metrics", (e as Error) ?? new Error("Failed to update metrics config"));
				throw e;
			}
		},
		[enterpriseService, token, patch, setTabError, settings?.metrics],
	);

	const getQuizUsersAnswers = async (
		cursor: RequestCursor,
		limit: number,
		filters?: QuizTableFilters,
	): Promise<RequestData<QuizTest>> => {
		return await enterpriseService.getQuizUsersAnswers(token, limit, cursor, filters);
	};

	const getMetricsTableData = async (
		cursor?: number,
		startDate?: string,
		endDate?: string,
		sortBy?: string,
		sortOrder?: string,
		userEmails?: string[],
		anonymousFilter?: AnonymousFilter,
	): Promise<TableDataResponse | null> => {
		const effectiveInterval = settings?.metrics?.interval || "month";
		const dates =
			startDate && endDate
				? { startDate, endDate }
				: getDateRangeForInterval(effectiveInterval === "custom" ? "month" : effectiveInterval);
		return await enterpriseService.getMetricsTableData(
			token,
			dates.startDate,
			dates.endDate,
			PAGE_SIZE,
			cursor,
			sortBy,
			sortOrder,
			userEmails,
			anonymousFilter,
		);
	};

	const getMetricsUsers = async (
		search?: string,
		limit?: number,
		cursor?: number,
	): Promise<{
		users: string[];
		hasMore: boolean;
		nextCursor: number | null;
	} | null> => {
		return await enterpriseService.getMetricsUsers(token, search, limit, cursor);
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

	const searchUsers = async (query: string): Promise<searchUserInfo[]> => {
		const enterpriseSource = getEnterpriseSourceData(sourceDatas, enterpriseService.getGesUrl());
		return await enterpriseService.getUsers(query, enterpriseSource?.token ?? "");
	};

	const searchBranches = async (repoName: string): Promise<string[]> => {
		return await enterpriseService.getBranches(token, repoName);
	};

	const getSearchTableData = async (
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	): Promise<SearchTableDataResponse | null> => {
		const filters = loadMetricsFilters();
		const searchFilters = filters.search;
		const dates =
			searchFilters.interval === "custom"
				? { startDate: searchFilters.startDate, endDate: searchFilters.endDate }
				: getDateRangeForInterval(searchFilters.interval);

		setFlag(setRefreshing, "metrics", true);
		try {
			const response = await enterpriseService.getSearchMetricsTableData(
				token,
				dates.startDate,
				dates.endDate,
				cursor,
				sortBy,
				sortOrder,
				limit ?? 25,
			);

			if (!response) {
				return null;
			}

			return response;
		} catch (e) {
			setTabError("metrics", (e as Error) ?? new Error("Failed to load search table data"));
			return null;
		} finally {
			setFlag(setRefreshing, "metrics", false);
		}
	};

	const getSearchQueryDetails = async (
		query: string,
		startDate: string,
		endDate: string,
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	): Promise<SearchQueryDetailsResponse | null> => {
		try {
			const response = await enterpriseService.getSearchQueryDetails(
				token,
				query,
				startDate,
				endDate,
				cursor,
				sortBy,
				sortOrder,
				limit,
			);

			if (!response) {
				return null;
			}

			return response;
		} catch (e) {
			console.error("Failed to load search query details", e);
			return null;
		}
	};

	const getArticleRatings = async (
		startDate: string,
		endDate: string,
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	): Promise<ArticleRatingsResponse | null> => {
		try {
			const response = await enterpriseService.getArticleRatings(
				token,
				startDate,
				endDate,
				cursor,
				sortBy,
				sortOrder,
				limit,
			);

			if (!response) {
				return null;
			}

			return response;
		} catch (e) {
			console.error("Failed to load article ratings", e);
			return null;
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional partial deps
	const settingsWithBuiltInModules = useMemo((): SettingsState => {
		const builtInUpdateHandlers = {
			styleGuide: updateStyleGuide,
			quiz: updateQuiz,
		};

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
						const handler = builtInUpdateHandlers[def.id];
						if (handler) {
							await handler(newSettings);
						}
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
	}, [settings, updateMetrics, updateQuiz, updateStyleGuide]);

	return (
		<SettingsContext.Provider
			value={{
				settings: settingsWithBuiltInModules,
				global: { allGitResources },
				error,
				users,
				hasUsers,
				updateEditors,
				updateWorkspace,
				updateMail,
				updateGuests,
				updatePlugins,
				updateStyleGuide,
				addGroup,
				deleteGroups,
				renameGroup,
				updateGroup,
				addResource,
				deleteResources,
				searchUsers,
				searchBranches,
				ensureWorkspaceLoaded,
				healthcheckStyleGuide,
				healthcheckDataProvider,
				ensureMailLoaded,
				ensureGuestsLoaded,
				ensureGroupsLoaded,
				ensureEditorsLoaded,
				ensurePluginsLoaded,
				ensureMetricsLoaded,
				ensureSearchMetricsLoaded,
				ensureStyleGuideLoaded,
				ensureResourcesLoaded,
				ensureQuizLoaded,
				searchAnsweredUsers,
				updateQuiz,
				updateMetrics,
				getQuizUsersAnswers,
				getQuizDetailedUserAnswers,
				getMetricsTableData,
				loadFilteredChartData,
				loadFilteredSearchChartData,
				getSearchTableData,
				getSearchQueryDetails,
				getArticleRatings,
				getMetricsUsers,
				searchQuizTests,
				isInitialLoading,
				isRefreshing,
				getTabError,
				clearTabError,
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
