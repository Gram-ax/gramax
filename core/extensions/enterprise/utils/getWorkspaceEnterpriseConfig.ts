import type { EnterpriseConfig } from "@app/config/AppConfig";
import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";

type WorkspaceEnterpriseSource = Pick<WorkspaceConfig, "enterprise">;

export const getWorkspaceGesUrl = (workspaceConfig?: WorkspaceEnterpriseSource): string | undefined => {
	return workspaceConfig?.enterprise?.gesUrl;
};

export const getWorkspaceEnterpriseConfig = (workspaceConfig?: WorkspaceEnterpriseSource): EnterpriseConfig => {
	const gesUrl = getWorkspaceGesUrl(workspaceConfig);
	const refreshInterval = workspaceConfig?.enterprise?.refreshInterval;

	return {
		gesUrl,
		refreshInterval,
	};
};
