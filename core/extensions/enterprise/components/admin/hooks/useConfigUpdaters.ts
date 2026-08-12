import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import { useApi } from "@core-ui/hooks/useApi";
import type { GroupValue } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import type EnterpriseService from "@ext/enterprise/EnterpriseService";
import type { Settings } from "@ext/enterprise/types/EnterpriseAdmin";
import { setStateObjectValue } from "@ext/enterprise/utils/setStateObjectValue";
import { type Dispatch, type SetStateAction, useCallback, useMemo } from "react";

export type UpdatePayloads = {
	workspace: Settings["workspace"];
	editors: Settings["editors"];
	mail: Settings["mail"];
	guests: Settings["guests"];
	styleGuide: Settings["styleGuide"];
	plugins: Settings["plugins"];
	quiz: Settings["quiz"];
	metrics: { enabled: boolean };
};

interface UseConfigUpdatersArgs {
	settings: Partial<Settings>;
	enterpriseService: EnterpriseService;
	token: string;
	setSettings: Dispatch<SetStateAction<Partial<Settings>>>;
}

export const useConfigUpdaters = (args: UseConfigUpdatersArgs) => {
	const { settings, enterpriseService, token, setSettings } = args;
	const { refreshStyle, refreshHomeLogo } = WorkspaceAssetsService.value();

	const { call: refreshWorkspace } = useApi({
		url: (api) => api.refreshEnterpriseWorkspace(),
	});

	const addGroup = useCallback(
		async (group: { groupId: string; groupValue: GroupValue[]; groupName?: string }) => {
			await enterpriseService.addGroup(token, group);
		},
		[enterpriseService, token],
	);

	const deleteGroups = useCallback(
		async (groupIds: string[]) => {
			await enterpriseService.deleteGroups(token, groupIds);
		},
		[enterpriseService, token],
	);

	const renameGroup = useCallback(
		async (groupId: string, newName: string) => {
			await enterpriseService.renameGroup(token, groupId, newName);
		},
		[enterpriseService, token],
	);

	const addResource = useCallback(
		async (resource: ResourcesSettings) => {
			await enterpriseService.addResource(token, resource);
		},
		[enterpriseService, token],
	);

	const deleteResources = useCallback(
		async (resourceIds: string[]) => {
			await enterpriseService.deleteResources(token, resourceIds);
		},
		[enterpriseService, token],
	);

	const updateHandlers: { [K in keyof UpdatePayloads]: (value: UpdatePayloads[K]) => Promise<void> } = useMemo(
		() => ({
			editors: async (editors) => {
				await enterpriseService.setEditors(token, editors);
				setStateObjectValue(setSettings, "editors", editors);
			},
			workspace: async (workspace) => {
				await enterpriseService.setWorkspace(token, workspace);
				setStateObjectValue(setSettings, "workspace", workspace);
				await refreshWorkspace?.();
				refreshStyle?.();
				await refreshHomeLogo?.();
			},
			mail: async (mail) => {
				await enterpriseService.setMail(token, mail);
			},
			guests: async (guests) => {
				await enterpriseService.setGuests(token, guests);
				setStateObjectValue(setSettings, "guests", guests);
			},
			styleGuide: async (styleGuide) => {
				await enterpriseService.setStyleGuide(token, styleGuide);
				setStateObjectValue(setSettings, "styleGuide", styleGuide);
				await refreshWorkspace?.();
			},
			plugins: async (plugins) => {
				await enterpriseService.setPlugins(token, plugins);
				setStateObjectValue(setSettings, "plugins", plugins);
			},
			quiz: async (quiz) => {
				await enterpriseService.setQuizConfig(token, quiz);
				setStateObjectValue(setSettings, "quiz", quiz);
				await refreshWorkspace?.();
			},
			metrics: async (metricsConfig) => {
				await enterpriseService.setMetricsConfig(token, metricsConfig);
				setStateObjectValue(setSettings, "metrics", {
					...settings?.metrics,
					enabled: metricsConfig.enabled,
				} as Settings["metrics"]);
			},
		}),
		[enterpriseService, settings?.metrics, token, refreshHomeLogo, refreshStyle, refreshWorkspace, setSettings],
	);

	const update = useCallback(
		<K extends keyof UpdatePayloads>(tab: K, value: UpdatePayloads[K]): Promise<void> => {
			return updateHandlers[tab](value);
		},
		[updateHandlers],
	);

	return { update, addGroup, deleteGroups, renameGroup, addResource, deleteResources };
};
