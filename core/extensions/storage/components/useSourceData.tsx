import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useState } from "react";

const useSourceData = (name?: string) => {
	const [cached, setCached] = useState<SourceData | null>(null);
	const pageDataContext = PageDataContextService.value;
	const sourceName = name || CatalogPropsService.value?.sourceName;

	useWatch(() => {
		const sourceData = sourceName
			? pageDataContext.sourceDatas.find((s) => getStorageNameByData(s) === sourceName)
			: null;
		setCached(sourceData);
	}, [pageDataContext, sourceName]);

	return cached;
};

export default useSourceData;
