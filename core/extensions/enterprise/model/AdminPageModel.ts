import { Page } from "@ext/enterprise/types/Page";

export type AdminPageModel = AdminSinglePageModel | AdminGroupPageModel;

export interface BaseAdminPageModel {
	page: Page;
	icon: string;
}

export interface AdminSinglePageModel extends BaseAdminPageModel {
	type: "single";
}

export interface AdminGroupPageModel extends BaseAdminPageModel {
	type: "group";
	children: AdminPageModel[];
}

const viewMetricsPageModel: AdminSinglePageModel = {
	type: "single",
	page: Page.VIEW_METRICS,
	icon: "eye",
};

const searchMetricsPageModel: AdminSinglePageModel = {
	type: "single",
	page: Page.SEARCH_METRICS,
	icon: "search",
};

export const pluginsPageModel: AdminGroupPageModel = {
	type: "group",
	page: Page.PLUGINS,
	icon: "package",
	// TODO: PLUGINS dynamically adding children
	children: [],
};

export const adminPageModels: Partial<Record<Page, AdminPageModel>> = {
	[Page.WORKSPACE]: {
		type: "single",
		page: Page.WORKSPACE,
		icon: "layers",
	},
	[Page.USER_GROUPS]: {
		type: "single",
		page: Page.USER_GROUPS,
		icon: "users",
	},
	[Page.EDITORS]: {
		type: "single",
		page: Page.EDITORS,
		icon: "user-round-pen",
	},
	[Page.RESOURCES]: {
		type: "single",
		page: Page.RESOURCES,
		icon: "git-branch",
	},
	[Page.MAIL]: {
		type: "single",
		page: Page.MAIL,
		icon: "mail",
	},
	[Page.GUESTS]: {
		type: "single",
		page: Page.GUESTS,
		icon: "users",
	},
	// [Page.ROLES]: {
	// 	type: "single",
	// 	page: Page.ROLES,
	// 	icon: "shield",
	// },
	[Page.METRICS]: {
		type: "group",
		page: Page.METRICS,
		icon: "chart-bar",
		children: [viewMetricsPageModel, searchMetricsPageModel],
	},
	[Page.VIEW_METRICS]: viewMetricsPageModel,
	[Page.SEARCH_METRICS]: searchMetricsPageModel,
	[Page.PLUGINS]: pluginsPageModel,
};

export const adminPageModelsArr = Object.values([
	adminPageModels[Page.WORKSPACE],
	adminPageModels[Page.USER_GROUPS],
	adminPageModels[Page.EDITORS],
	adminPageModels[Page.RESOURCES],
	adminPageModels[Page.MAIL],
	adminPageModels[Page.GUESTS],
	adminPageModels[Page.METRICS],
]);
