import type { LfsOptions } from "@core/GitLfs/options";
import { RequestStatus, useApi, useDeferApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { useCallback, useMemo } from "react";

export const useEditLfsOptions = () => {
	const { call: getLfsOptions, status } = useApi<LfsOptions>({
		url: (api) => api.getLfsOptions(),
	});

	const { call: updateLfsOptions, reset: resetUpdateLfsOptions } = useDeferApi<void>({
		url: (api) => api.updateLfsOptions(),
	});

	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const allowed = useMemo(
		() => isGitSourceType(getPartGitSourceDataByStorageName(sourceName)?.sourceType),
		[sourceName],
	);

	return {
		isLoading: status === RequestStatus.Loading,

		allowed,

		getLfsOptions: useCallback(async () => {
			const patterns = await getLfsOptions();
			return patterns || null;
		}, [getLfsOptions]),

		updateLfsOptions: useCallback(
			async (opts: Partial<LfsOptions>) => {
				await updateLfsOptions({ opts: { body: JSON.stringify(opts) } });
				resetUpdateLfsOptions();
			},
			[updateLfsOptions, resetUpdateLfsOptions],
		),
	};
};
