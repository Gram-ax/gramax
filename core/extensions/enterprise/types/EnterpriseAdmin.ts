import EditorsComponent from "@ext/enterprise/components/admin/settings/editors/EditorsComponent";
import { EditorsSettings } from "@ext/enterprise/components/admin/settings/editors/types/EditorsComponentTypes";
import GroupsComponent from "@ext/enterprise/components/admin/settings/groups/GroupsComponent";
import { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import GuestsComponent from "@ext/enterprise/components/admin/settings/guests/GuestsComponent";
import { GuestsSettings } from "@ext/enterprise/components/admin/settings/guests/types/GuestsComponent";
import MailComponent, { MailSettings } from "@ext/enterprise/components/admin/settings/MailComponent";
import type { QuizSettings } from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import QuizComponent from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import ResourcesComponent from "@ext/enterprise/components/admin/settings/resources/ResourcesComponent";
import { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import StyleGuideComponent, {
	StyleGuideSettings,
} from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import WorkspaceComponent from "@ext/enterprise/components/admin/settings/workspace/WorkspaceComponent";
import { ComponentType } from "react";

export enum Page {
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
};

export const PageComponents: Record<Page, ComponentType> = {
	[Page.STYLEGUIDE]: StyleGuideComponent,
	[Page.QUIZ]: QuizComponent,
	[Page.EDITORS]: EditorsComponent,
	[Page.WORKSPACE]: WorkspaceComponent,
	[Page.RESOURCES]: ResourcesComponent,
	[Page.USER_GROUPS]: GroupsComponent,
	[Page.MAIL]: MailComponent,
	[Page.GUESTS]: GuestsComponent,
};

export const defaultGroupKeys = ["Everyone", "Authenticated"];
