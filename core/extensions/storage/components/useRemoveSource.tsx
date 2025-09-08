import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useCallback, useState } from "react";

export type UseRemoveSourceProps = {
	sourceName: string;
};

const useRemoveSource = ({ sourceName }: UseRemoveSourceProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const sourceDatas = SourceDataService.value;
	const [isLoading, setIsLoading] = useState(false);

	const { start: debouncedDisplayLoading, cancel: cancelDisplayLoading } = useDebounce(() => setIsLoading(true), 350);

	const getSourceUsage = useCallback(async () => {
		try {
			debouncedDisplayLoading();
			const res = await FetchService.fetch(apiUrlCreator.getSourceDataUsage(sourceName));
			if (res.ok) return (await res.json()) as string[];
		} finally {
			cancelDisplayLoading();
			setIsLoading(false);
		}
		return [];
	}, [apiUrlCreator, sourceName]);

	const removeSource = useCallback(async () => {
		try {
			debouncedDisplayLoading();
			const res = await FetchService.fetch(apiUrlCreator.removeSourceData(sourceName));
			if (!res.ok) return;

			const newSourceDatas = sourceDatas.filter((s) => getStorageNameByData(s) !== sourceName);
			SourceDataService.value = [...newSourceDatas];
		} finally {
			cancelDisplayLoading();
			setIsLoading(false);
		}
	}, [apiUrlCreator, sourceName]);

	return { removeSource, getSourceUsage, isLoading };
};

export default useRemoveSource;
