import EditorsComponent from "@ext/enterprise/components/admin/settings/editors/EditorsComponent";
import { EditorsSettings } from "@ext/enterprise/components/admin/settings/editors/types/EditorsComponentTypes";
import GroupsComponent from "@ext/enterprise/components/admin/settings/groups/GroupsComponent";
import { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import GuestsComponent from "@ext/enterprise/components/admin/settings/guests/GuestsComponent";
import { GuestsSettings } from "@ext/enterprise/components/admin/settings/guests/types/GuestsComponent";
import MailComponent, { MailSettings } from "@ext/enterprise/components/admin/settings/MailComponent";
import MetricsComponent from "@ext/enterprise/components/admin/settings/metrics/MetricsComponent";
import { MetricsSettings } from "@ext/enterprise/components/admin/settings/metrics/types";
import PluginDetailComponent from "@ext/enterprise/components/admin/settings/plugins/PluginDetail/PluginDetailComponent";
import PluginsComponent from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsComponent";
import QuizComponent from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import type { QuizSettings } from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import ResourcesComponent from "@ext/enterprise/components/admin/settings/resources/ResourcesComponent";
import { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import StyleGuideComponent, {
	StyleGuideSettings,
} from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import WorkspaceComponent from "@ext/enterprise/components/admin/settings/workspace/WorkspaceComponent";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { PluginConfig } from "@plugins/types";
import { ComponentType } from "react";

export interface PluginsSettings {
	plugins: PluginConfig[];
}

export enum Page {
	PLUGINS = "plugins",
	PLUGIN_DETAIL = "pluginDetail",
	METRICS = "metrics",
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
	[Page.METRICS]: MetricsComponent,
};
