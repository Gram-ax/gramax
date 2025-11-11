import { GroupValue } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import type { Settings } from "@ext/enterprise/types/EnterpriseAdmin";
import EnterpriseService, { type searchUserInfo } from "@ext/enterprise/EnterpriseService";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react";
import {
	QuizTestData,
	SearchedAnsweredUsers,
	SearchedQuizTest,
	QuizTest,
} from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import { QuizTableFilters } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTableControls";
import t from "@ext/localization/locale/translate";
import { RequestCursor, RequestData } from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable";

export type SettingsState = Partial<Settings>;

// Tab keys for per-tab loading/error isolation
export type TabKey = "workspace" | "groups" | "editors" | "resources" | "mail" | "guests" | "check" | "quiz";

type SettingsContextType = {
	settings: Readonly<SettingsState>;
	error: Error | null;
	users: string[] | null;
	hasUsers: boolean;
	updateEditors: (editors: Settings["editors"]) => Promise<void>;
	addGroup: (group: { groupId: string; groupValue: GroupValue[] }) => Promise<void>;
	deleteGroups: (groupIds: string[]) => Promise<void>;
	updateWorkspace: (workspace: Settings["workspace"]) => Promise<void>;
	addResource: (resource: ResourcesSettings) => Promise<void>;
	deleteResources: (resourceIds: string[]) => Promise<void>;
	updateMail: (mail: Settings["mailServer"]) => Promise<void>;
	updateGuests: (guests: Settings["guests"]) => Promise<void>;
	updateCheck: (check: Settings["check"]) => Promise<void>;
	searchUsers: (query: string) => Promise<searchUserInfo[]>;
	searchBranches: (repoName: string) => Promise<string[]>;
	updateQuiz: (quiz: Settings["quiz"]) => Promise<void>;
	getQuizUsersAnswers: (
		cursor: RequestCursor,
		limit: number,
		filters: QuizTableFilters,
	) => Promise<RequestData<QuizTest>>;
	getQuizDetailedUserAnswers: (testId: string) => Promise<QuizTestData>;
	searchQuizTests: (query: string) => Promise<SearchedQuizTest[]>;
	searchAnsweredUsers: (query: string) => Promise<SearchedAnsweredUsers[]>;
	// Per-tab loaders (ленивые)
	ensureWorkspaceLoaded: (force?: boolean) => Promise<void>;
	ensureMailLoaded: (force?: boolean) => Promise<void>;
	ensureGuestsLoaded: (force?: boolean) => Promise<void>;
	ensureGroupsLoaded: (force?: boolean) => Promise<void>;
	ensureResourcesLoaded: (force?: boolean) => Promise<void>;
	ensureEditorsLoaded: (force?: boolean) => Promise<void>;
	ensureCheckLoaded: (force?: boolean) => Promise<void>;
	ensureQuizLoaded: (force?: boolean) => Promise<void>;
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
	// ETags per tab
	const [mailEtag, setMailEtag] = useState<string | null>(null);
	const [guestsEtag, setGuestsEtag] = useState<string | null>(null);
	const [groupsEtag, setGroupsEtag] = useState<string | null>(null);
	const [editorsEtag, setEditorsEtag] = useState<string | null>(null);
	const [checkEtag, setCheckEtag] = useState<string | null>(null);
	const [quizEtag, setQuizEtag] = useState<string | null>(null);
	const [resourcesEtag, setResourcesEtag] = useState<string | null>(null);
	const [workspaceEtag, setWorkspaceEtag] = useState<string | null>(null);

	// Per-tab loading and error state
	const tabs: TabKey[] = ["workspace", "groups", "editors", "resources", "mail", "guests", "check", "quiz"];
	const makeBoolMap = (val: boolean) =>
		tabs.reduce((acc, t) => ({ ...acc, [t]: val }), {} as Record<TabKey, boolean>);
	const makeErrorMap = () => tabs.reduce((acc, t) => ({ ...acc, [t]: null }), {} as Record<TabKey, Error | null>);

	const [initialLoading, setInitialLoading] = useState<Record<TabKey, boolean>>(makeBoolMap(true));
	const [refreshing, setRefreshing] = useState<Record<TabKey, boolean>>(makeBoolMap(false));
	const [tabErrors, setTabErrors] = useState<Record<TabKey, Error | null>>(makeErrorMap());

	const setFlag = (setter: Dispatch<SetStateAction<Record<TabKey, boolean>>>, tab: TabKey, value: boolean) =>
		setter((prev) => ({ ...prev, [tab]: value }));

	const setTabError = (tab: TabKey, e: Error | null) => setTabErrors((prev) => ({ ...prev, [tab]: e }));
	const clearTabError = (tab: TabKey) => setTabError(tab, null);
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

	const patch = <K extends keyof Settings>(key: K, value: Settings[K]) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const checkHasUsers = async () => {
		try {
			const hasUsersCheck = await enterpriseService.checkConnector();
			setHasUsers(hasUsersCheck);
		} catch (e) {
			setError(e as Error);
		}
	};

	useEffect(() => {
		checkHasUsers();
	}, [enterpriseService, token]);

	const ensureWorkspaceLoaded = async (force = false) => {
		await withLoad("workspace", Boolean(settings?.workspace), async () => {
			const { data, etag, notModified } = await enterpriseService.getWorkspaceConfig(
				token,
				force ? undefined : workspaceEtag ?? undefined,
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
				force ? undefined : mailEtag ?? undefined,
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
				force ? undefined : guestsEtag ?? undefined,
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
				force ? undefined : resourcesEtag ?? undefined,
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
				force ? undefined : groupsEtag ?? undefined,
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
				force ? undefined : editorsEtag ?? undefined,
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
				force ? undefined : quizEtag ?? undefined,
			);
			if (!notModified && data) patch("quiz", data);
			if (etag) setQuizEtag(etag);
			return true as const;
		});
	};

	const ensureCheckLoaded = async (force = false) => {
		await withLoad("check", Boolean(settings?.check), async () => {
			const { data, etag, notModified } = await enterpriseService.getCheckConfig(
				token,
				force ? undefined : checkEtag ?? undefined,
			);
			if (!notModified && data) patch("check", data);
			if (etag) setCheckEtag(etag);
			return true as const;
		});
	};

	const updateEditors = async (editors: Settings["editors"]) => {
		try {
			await enterpriseService.setEditors(token, editors);
			patch("editors", editors);
		} catch (e) {
			setTabError("editors", (e as Error) ?? new Error("Не удалось обновить данные редакторов"));
			throw e;
		}
	};

	const addGroup = async (group: { groupId: string; groupValue: GroupValue[] }) => {
		try {
			await enterpriseService.addGroup(token, group);
			await ensureGroupsLoaded(true);
		} catch (e) {
			setTabError("groups", (e as Error) ?? new Error("Не удалось добавить группу"));
			throw e;
		}
	};

	const deleteGroups = async (groupIds: string[]) => {
		try {
			await enterpriseService.deleteGroups(token, groupIds);
			await ensureGroupsLoaded(true);
		} catch (e) {
			setTabError("groups", (e as Error) ?? new Error("Не удалось удалить группы"));
			throw e;
		}
	};

	const updateWorkspace = async (workspace: Settings["workspace"]) => {
		try {
			await enterpriseService.setWorkspace(token, workspace);
			patch("workspace", workspace);
		} catch (e) {
			setTabError("workspace", (e as Error) ?? new Error("Не удалось обновить данные пространства"));
			throw e;
		}
		patch("workspace", workspace);
	};

	const addResource = async (resource: ResourcesSettings) => {
		try {
			await enterpriseService.addResource(token, resource);
			await ensureResourcesLoaded(true);
		} catch (e) {
			setTabError("resources", (e as Error) ?? new Error("Не удалось добавить репозиторий"));
			throw e;
		}
	};

	const deleteResources = async (resourceIds: string[]) => {
		try {
			await enterpriseService.deleteResources(token, resourceIds);
			await ensureResourcesLoaded(true);
		} catch (e) {
			setTabError("resources", (e as Error) ?? new Error("Не удалось удалить репозиторий"));
			throw e;
		}
	};

	const updateMail = async (mail: Settings["mailServer"]) => {
		try {
			await enterpriseService.setMail(token, mail);
			await ensureMailLoaded(true);
		} catch (e) {
			setTabError("mail", (e as Error) ?? new Error("Не удалось обновить данные почтового клиента"));
			throw e;
		}
	};

	const updateGuests = async (guests: Settings["guests"]) => {
		try {
			await enterpriseService.setGuests(token, guests);
			patch("guests", guests);
		} catch (e) {
			setTabError("guests", (e as Error) ?? new Error("Не удалось обновить данные внешних читателей"));
			throw e;
		}
	};

	const updateCheck = async (check: Settings["check"]) => {
		try {
			await enterpriseService.setCheck(token, check);
			patch("check", check);
		} catch (e) {
			setTabError("check", (e as Error) ?? new Error("Не удалось обновить данные стайлгайдов"));
			throw e;
		}
	};

	const updateQuiz = async (quiz: Settings["quiz"]) => {
		try {
			await enterpriseService.setQuizConfig(token, quiz);
			patch("quiz", quiz);
		} catch (e) {
			setTabError("quiz", (e as Error) ?? new Error(t("enterprise.admin.quiz.errors.update")));
			throw e;
		}
	};

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

	const getQuizDetailedUserAnswers = async (testId: string): Promise<QuizTestData> => {
		return await enterpriseService.getQuizDetailedUserAnswers(token, testId);
	};

	const searchUsers = async (query: string): Promise<searchUserInfo[]> => {
		return await enterpriseService.getUsers(query);
	};

	const searchBranches = async (repoName: string): Promise<string[]> => {
		return await enterpriseService.getBranches(token, repoName);
	};

	return (
		<SettingsContext.Provider
			value={{
				settings,
				error,
				users,
				hasUsers,
				updateEditors,
				updateWorkspace,
				updateMail,
				updateGuests,
				updateCheck,
				addGroup,
				deleteGroups,
				addResource,
				deleteResources,
				searchUsers,
				searchBranches,
				ensureWorkspaceLoaded,
				ensureMailLoaded,
				ensureGuestsLoaded,
				ensureGroupsLoaded,
				ensureEditorsLoaded,
				ensureCheckLoaded,
				ensureResourcesLoaded,
				ensureQuizLoaded,
				searchAnsweredUsers,
				updateQuiz,
				getQuizUsersAnswers,
				getQuizDetailedUserAnswers,
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
