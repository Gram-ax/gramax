import CheckComponent, { CheckSettings } from "@ext/enterprise/components/admin/settings/check/CheckComponent";
import QuizComponent from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import EditorsComponent from "@ext/enterprise/components/admin/settings/editors/EditorsComponent";
import { EditorsSettings } from "@ext/enterprise/components/admin/settings/editors/types/EditorsComponentTypes";
import GroupsComponent from "@ext/enterprise/components/admin/settings/groups/GroupsComponent";
import { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import GuestsComponent from "@ext/enterprise/components/admin/settings/guests/GuestsComponent";
import { GuestsSettings } from "@ext/enterprise/components/admin/settings/guests/types/GuestsComponent";
import MailComponent, { MailSettings } from "@ext/enterprise/components/admin/settings/MailComponent";
import ResourcesComponent from "@ext/enterprise/components/admin/settings/resources/ResourcesComponent";
import { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import WorkspaceComponent from "@ext/enterprise/components/admin/settings/workspace/WorkspaceComponent";
import { ComponentType } from "react";
import type { QuizSettings } from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";

export enum Page {
	CHECK = "check",
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
	check: CheckSettings;
	guests: GuestsSettings;
	quiz: QuizSettings;
};

export interface PageComponentProps {
	selectAllResources: string[];
}

export const PageComponents: Record<Page, ComponentType<PageComponentProps>> = {
	[Page.CHECK]: CheckComponent,
	[Page.QUIZ]: QuizComponent,
	[Page.EDITORS]: EditorsComponent,
	[Page.WORKSPACE]: WorkspaceComponent,
	[Page.RESOURCES]: ResourcesComponent,
	[Page.USER_GROUPS]: GroupsComponent,
	[Page.MAIL]: MailComponent,
	[Page.GUESTS]: GuestsComponent,
};

export const defaultGroupKeys = ["Everyone", "Authenticated"];
