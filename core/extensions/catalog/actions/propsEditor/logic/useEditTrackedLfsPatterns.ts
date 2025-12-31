import type { GetTrackedLfsPatternsResult } from "@app/commands/versionControl/lfs/getTrackedLfsPatterns";
import { RequestStatus, useApi, useDeferApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { useCallback, useMemo } from "react";

export const useEditTrackedLfsPatterns = () => {
	const { call: getTrackedLfsPatterns, status } = useApi<GetTrackedLfsPatternsResult, string[]>({
		url: (api) => api.getTrackedLfsPatterns(),
    map: (data) => data.patterns,
	});

	const { call: updateTrackedLfsPatterns, reset: resetUpdateTrackedLfsPatterns } = useDeferApi<void>({
		url: (api) => api.updateTrackedLfsPatterns(),
	});

	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const allowed = useMemo(
		() => isGitSourceType(getPartGitSourceDataByStorageName(sourceName)?.sourceType),
		[sourceName],
	);

	return {
		isLoading: status === RequestStatus.Loading,

		allowed,

		getTrackedLfsPatterns: useCallback(async () => {
			const patterns = await getTrackedLfsPatterns();
			return patterns || null;
		}, [getTrackedLfsPatterns]),

		updateTrackedLfsPatterns: useCallback(
			async (patterns: string[]) => {
				await updateTrackedLfsPatterns({ opts: { body: JSON.stringify(patterns) } });
				resetUpdateTrackedLfsPatterns();
			},
			[updateTrackedLfsPatterns, resetUpdateTrackedLfsPatterns],
		),
	};
};
