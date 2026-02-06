import EditorsComponent from "@ext/enterprise/components/admin/settings/editors/EditorsComponent";
import type { EditorsSettings } from "@ext/enterprise/components/admin/settings/editors/types/EditorsComponentTypes";
import GroupsComponent from "@ext/enterprise/components/admin/settings/groups/GroupsComponent";
import type { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import GuestsComponent from "@ext/enterprise/components/admin/settings/guests/GuestsComponent";
import type { GuestsSettings } from "@ext/enterprise/components/admin/settings/guests/types/GuestsComponent";
import MailComponent, { type MailSettings } from "@ext/enterprise/components/admin/settings/MailComponent";
import MetricsPage from "@ext/enterprise/components/admin/settings/metrics/MetricsPage";
import SearchMetricsComponent from "@ext/enterprise/components/admin/settings/metrics/search/SearchMetricsComponent";
import type { MetricsSettings, SearchMetricsSettings } from "@ext/enterprise/components/admin/settings/metrics/types";
import ViewMetricsComponent from "@ext/enterprise/components/admin/settings/metrics/view/ViewMetricsComponent";
import PluginDetailComponent from "@ext/enterprise/components/admin/settings/plugins/PluginDetail/PluginDetailComponent";
import PluginsComponent from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsComponent";
import type { QuizSettings } from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import QuizComponent from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import ResourcesComponent from "@ext/enterprise/components/admin/settings/resources/ResourcesComponent";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import StyleGuideComponent, {
	type StyleGuideSettings,
} from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import WorkspaceComponent from "@ext/enterprise/components/admin/settings/workspace/WorkspaceComponent";
import type { PluginConfig } from "@plugins/types";
import type { ComponentType } from "react";

export interface PluginsSettings {
	plugins: PluginConfig[];
}

export enum Page {
	PLUGINS = "plugins",
	PLUGIN_DETAIL = "pluginDetail",
	METRICS = "metrics",
	VIEW_METRICS = "viewMetrics",
	SEARCH_METRICS = "searchMetrics",
	STYLEGUIDE = "styleGuide",
	QUIZ = "quiz",
	EDITORS = "editors",
	WORKSPACE = "workspace",
	RESOURCES = "resources",
	USER_GROUPS = "groups",
	MAIL = "mail",
	GUESTS = "guests",
}

export type Settings = {
	workspace: WorkspaceSettings;
	groups: GroupsSettings;
	editors: EditorsSettings;
	resources: ResourcesSettings[];
	mailServer: MailSettings;
	styleGuide: StyleGuideSettings;
	guests: GuestsSettings;
	quiz: QuizSettings;
	plugins: PluginsSettings;
	metrics: MetricsSettings;
	searchMetrics: SearchMetricsSettings;
};

export const defaultGroupKeys = ["Everyone", "Authenticated"];

export const PageComponents: Record<Page, ComponentType> = {
	[Page.WORKSPACE]: WorkspaceComponent,
	[Page.USER_GROUPS]: GroupsComponent,
	[Page.EDITORS]: EditorsComponent,
	[Page.STYLEGUIDE]: StyleGuideComponent,
	[Page.RESOURCES]: ResourcesComponent,
	[Page.MAIL]: MailComponent,
	[Page.GUESTS]: GuestsComponent,
	[Page.PLUGINS]: PluginsComponent,
	[Page.PLUGIN_DETAIL]: PluginDetailComponent,
	[Page.QUIZ]: QuizComponent,
	[Page.METRICS]: MetricsPage,
	[Page.VIEW_METRICS]: ViewMetricsComponent,
	[Page.SEARCH_METRICS]: SearchMetricsComponent,
};
