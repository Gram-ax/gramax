import { Page } from "@ext/enterprise/types/EnterpriseAdmin";

export type PageDataLoader = {
	[K in Page]: (loaders: {
		ensureWorkspaceLoaded: () => Promise<void>;
		ensureGroupsLoaded: () => Promise<void>;
		ensureEditorsLoaded: () => Promise<void>;
		ensureResourcesLoaded: () => Promise<void>;
		ensureMailLoaded: () => Promise<void>;
		ensureGuestsLoaded: () => Promise<void>;
		ensureStyleGuideLoaded: () => Promise<void>;
		ensureQuizLoaded: () => Promise<void>;
		ensurePluginsLoaded: () => Promise<void>;
		ensureMetricsLoaded: () => Promise<void>;
		ensureSearchMetricsLoaded: () => Promise<void>;
	}) => Promise<void>;
};

export const pageDataLoaders: PageDataLoader = {
	[Page.WORKSPACE]: async ({ ensureWorkspaceLoaded, ensureResourcesLoaded, ensureGroupsLoaded }) => {
		await Promise.all([ensureWorkspaceLoaded(), ensureResourcesLoaded(), ensureGroupsLoaded()]);
	},
	[Page.EDITORS]: async ({ ensureEditorsLoaded }) => {
		await ensureEditorsLoaded();
	},
	[Page.RESOURCES]: async ({
		ensureWorkspaceLoaded,
		ensureGroupsLoaded,
		ensureGuestsLoaded,
		ensureResourcesLoaded,
	}) => {
		await Promise.all([
			ensureWorkspaceLoaded(),
			ensureGroupsLoaded(),
			ensureGuestsLoaded(),
			ensureResourcesLoaded(),
		]);
	},
	[Page.USER_GROUPS]: async ({ ensureResourcesLoaded, ensureGroupsLoaded }) => {
		await Promise.all([ensureResourcesLoaded(), ensureGroupsLoaded()]);
	},
	[Page.STYLEGUIDE]: async ({ ensureStyleGuideLoaded }) => {
		await ensureStyleGuideLoaded();
	},
	[Page.PLUGINS]: async ({ ensurePluginsLoaded, ensureStyleGuideLoaded, ensureQuizLoaded }) => {
		await Promise.all([ensurePluginsLoaded(), ensureStyleGuideLoaded(), ensureQuizLoaded()]);
	},
	[Page.PLUGIN_DETAIL]: async ({ ensurePluginsLoaded }) => {
		await ensurePluginsLoaded();
	},
	[Page.MAIL]: async ({ ensureMailLoaded }) => {
		await ensureMailLoaded();
	},
	[Page.GUESTS]: async ({ ensureGuestsLoaded }) => {
		await ensureGuestsLoaded();
	},
	[Page.QUIZ]: async ({ ensureQuizLoaded }) => {
		await ensureQuizLoaded();
	},
	[Page.METRICS]: async ({ ensureMetricsLoaded }) => {
		await ensureMetricsLoaded();
	},
	[Page.VIEW_METRICS]: async ({ ensureMetricsLoaded }) => {
		await ensureMetricsLoaded();
	},
	[Page.SEARCH_METRICS]: async ({ ensureMetricsLoaded, ensureSearchMetricsLoaded }) => {
		await Promise.all([ensureMetricsLoaded(), ensureSearchMetricsLoaded()]);
	},
};

export const getPageDataLoader = (page: Page): PageDataLoader[Page] => {
	return pageDataLoaders[page];
};
