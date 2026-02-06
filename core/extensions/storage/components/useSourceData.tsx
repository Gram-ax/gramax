import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useState } from "react";

const useSourceData = (name?: string) => {
	const [cached, setCached] = useState<SourceData | null>(null);
	const sourceDatas = SourceDataService.value;
	const catalogSourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const sourceName = name || catalogSourceName;

	useWatch(() => {
		const sourceData = sourceName ? sourceDatas.find((s) => getStorageNameByData(s) === sourceName) : null;
		setCached(sourceData);
	}, [sourceDatas, sourceName]);

	return cached;
};

export default useSourceData;
