import GesCloudUsersComponent from "@ext/enterprise-cloud/components/organizationSettings/settings/members/GesCloudMembersComponent";
import GesCloudOrganizationComponent from "@ext/enterprise-cloud/components/organizationSettings/settings/organization/GesCloudOrganizationComponent";
import GesCloudOrgSettingsPage from "@ext/enterprise-cloud/types/GesCloudOrgSettingsPage";
import type { ComponentType } from "react";

export const PageComponents: Record<GesCloudOrgSettingsPage, ComponentType> = {
	[GesCloudOrgSettingsPage.ORGANIZATION]: GesCloudOrganizationComponent,
	[GesCloudOrgSettingsPage.MEMBERS]: GesCloudUsersComponent,
};
