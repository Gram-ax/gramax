import type { EditorsSettings } from "@ext/enterprise/components/admin/settings/editors/types/EditorsComponentTypes";
import type { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import type { GuestsSettings } from "@ext/enterprise/components/admin/settings/guests/types/GuestsComponent";
import type { MailSettings } from "@ext/enterprise/components/admin/settings/MailComponent";
import type { MetricsSettings, SearchMetricsSettings } from "@ext/enterprise/components/admin/settings/metrics/types";
import type { QuizSettings } from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import type { StyleGuideSettings } from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import type { PluginsSettings } from "@ext/enterprise/types/PluginsSettings";

export type Settings = {
	workspace: WorkspaceSettings;
	groups: GroupsSettings;
	editors: EditorsSettings;
	resources: ResourcesSettings[];
	mail: MailSettings;
	styleGuide: StyleGuideSettings;
	guests: GuestsSettings;
	quiz: QuizSettings;
	plugins: PluginsSettings;
	metrics: MetricsSettings;
	searchMetrics: SearchMetricsSettings;
};

export const tabKeys = [
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
] as const;

export type TabKey = (typeof tabKeys)[number];

// "searchMetrics" shares the "metrics" tab for loading/error state but has its own loader
export type LoadableTab = TabKey | "searchMetrics";

export const defaultGroupKeys = ["Everyone", "Authenticated"];
