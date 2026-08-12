import GesAccessTokensComponent from "@ext/enterprise/components/admin/settings/accessTokens/GesAccessTokensComponent";
import GroupsComponent from "@ext/enterprise/components/admin/settings/groups/GroupsComponent";
import GuestsComponent from "@ext/enterprise/components/admin/settings/guests/GuestsComponent";
import MailComponent from "@ext/enterprise/components/admin/settings/MailComponent";
import MetricsPage from "@ext/enterprise/components/admin/settings/metrics/MetricsPage";
import SearchMetricsComponent from "@ext/enterprise/components/admin/settings/metrics/search/SearchMetricsComponent";
import ViewMetricsComponent from "@ext/enterprise/components/admin/settings/metrics/view/ViewMetricsComponent";
import PluginDetailComponent from "@ext/enterprise/components/admin/settings/plugins/PluginDetail/PluginDetailComponent";
import PluginsComponent from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsComponent";
import QuizComponent from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import ReposComponent from "@ext/enterprise/components/admin/settings/resources/ReposComponent";
import StyleGuideComponent from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import UsersComponent from "@ext/enterprise/components/admin/settings/users/UsersComponent";
import WorkspaceComponent from "@ext/enterprise/components/admin/settings/workspace/WorkspaceComponent";
import type { LoadableTab } from "@ext/enterprise/types/EnterpriseAdmin";
import { Page } from "@ext/enterprise/types/Page";
import type { ComponentType } from "react";

export type PageLoaders = {
	ensureLoaded: (tab: LoadableTab, force?: boolean) => Promise<void>;
};

interface BaseAdminPageDescriptor {
	page: Page;
	icon: string;
	fullscreen?: boolean;
	component: ComponentType;
	loader: (loaders: PageLoaders) => Promise<void>;
}

export interface AdminSinglePageDescriptor extends BaseAdminPageDescriptor {
	type: "single";
}

export interface AdminGroupPageDescriptor extends BaseAdminPageDescriptor {
	type: "group";
	children: AdminPageDescriptor[];
	// When set, clicking the group in the sidebar navigates to this child instead of the group's own page.
	defaultChildPage?: Page;
}

export type AdminPageDescriptor = AdminSinglePageDescriptor | AdminGroupPageDescriptor;

export const getGroupTargetPage = (model: AdminGroupPageDescriptor): Page => model.defaultChildPage ?? model.page;

const membersLoader: BaseAdminPageDescriptor["loader"] = async ({ ensureLoaded }) => {
	await Promise.all([
		ensureLoaded("editors"),
		ensureLoaded("groups"),
		ensureLoaded("resources"),
		ensureLoaded("guests"),
		ensureLoaded("workspace"),
	]);
};

const viewMetricsDescriptor: AdminSinglePageDescriptor = {
	type: "single",
	page: Page.VIEW_METRICS,
	icon: "eye",
	component: ViewMetricsComponent,
	loader: async ({ ensureLoaded }) => {
		await ensureLoaded("metrics");
	},
};

const searchMetricsDescriptor: AdminSinglePageDescriptor = {
	type: "single",
	page: Page.SEARCH_METRICS,
	icon: "search",
	component: SearchMetricsComponent,
	loader: async ({ ensureLoaded }) => {
		await Promise.all([ensureLoaded("metrics"), ensureLoaded("searchMetrics")]);
	},
};

export const pluginsPageDescriptor: AdminGroupPageDescriptor = {
	type: "group",
	page: Page.PLUGINS,
	icon: "package",
	component: PluginsComponent,
	loader: async ({ ensureLoaded }) => {
		await Promise.all([ensureLoaded("plugins"), ensureLoaded("styleGuide"), ensureLoaded("quiz")]);
	},
	// TODO: PLUGINS dynamically adding children
	children: [],
};

export const adminPageDescriptors: Record<Page, AdminPageDescriptor> = {
	[Page.WORKSPACE]: {
		type: "single",
		page: Page.WORKSPACE,
		icon: "layers",
		component: WorkspaceComponent,
		loader: async ({ ensureLoaded }) => {
			await Promise.all([ensureLoaded("workspace"), ensureLoaded("resources"), ensureLoaded("groups")]);
		},
	},
	[Page.USERS]: {
		type: "single",
		page: Page.USERS,
		icon: "user",
		fullscreen: true,
		component: UsersComponent,
		loader: membersLoader,
	},
	[Page.GROUPS]: {
		type: "single",
		page: Page.GROUPS,
		icon: "users",
		fullscreen: true,
		component: GroupsComponent,
		loader: membersLoader,
	},
	[Page.RESOURCES]: {
		type: "single",
		page: Page.RESOURCES,
		icon: "git-branch",
		fullscreen: true,
		component: ReposComponent,
		loader: membersLoader,
	},
	[Page.MAIL]: {
		type: "single",
		page: Page.MAIL,
		icon: "mail",
		component: MailComponent,
		loader: async ({ ensureLoaded }) => {
			await ensureLoaded("mail");
		},
	},
	[Page.GUESTS]: {
		type: "single",
		page: Page.GUESTS,
		icon: "users",
		component: GuestsComponent,
		loader: membersLoader,
	},
	[Page.STYLEGUIDE]: {
		type: "single",
		page: Page.STYLEGUIDE,
		icon: "palette",
		component: StyleGuideComponent,
		loader: async ({ ensureLoaded }) => {
			await ensureLoaded("styleGuide");
		},
	},
	[Page.QUIZ]: {
		type: "single",
		page: Page.QUIZ,
		icon: "help-circle",
		fullscreen: true,
		component: QuizComponent,
		loader: async ({ ensureLoaded }) => {
			await ensureLoaded("quiz");
		},
	},
	[Page.METRICS]: {
		type: "group",
		page: Page.METRICS,
		icon: "chart-bar",
		component: MetricsPage,
		loader: async ({ ensureLoaded }) => {
			await ensureLoaded("metrics");
		},
		children: [viewMetricsDescriptor, searchMetricsDescriptor],
	},
	[Page.VIEW_METRICS]: viewMetricsDescriptor,
	[Page.SEARCH_METRICS]: searchMetricsDescriptor,
	[Page.PLUGINS]: pluginsPageDescriptor,
	[Page.PLUGIN_DETAIL]: {
		type: "single",
		page: Page.PLUGIN_DETAIL,
		icon: "package",
		component: PluginDetailComponent,
		loader: async ({ ensureLoaded }) => {
			await ensureLoaded("plugins");
		},
	},
	[Page.ACCESS_TOKENS]: {
		type: "single",
		page: Page.ACCESS_TOKENS,
		icon: "key-round",
		component: GesAccessTokensComponent,
		loader: async () => {},
	},
};

export const sidebarPageDescriptors: AdminPageDescriptor[] = [
	adminPageDescriptors[Page.WORKSPACE],
	adminPageDescriptors[Page.RESOURCES],
	adminPageDescriptors[Page.USERS],
	adminPageDescriptors[Page.GROUPS],
	adminPageDescriptors[Page.GUESTS],
	adminPageDescriptors[Page.MAIL],
	adminPageDescriptors[Page.METRICS],
	adminPageDescriptors[Page.ACCESS_TOKENS],
];
