import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { useMemo } from "react";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import getStorageNameByData from "./getStorageNameByData";

const useStorage = (sourceName?: string): SourceData | null => {
	const sourceDatas = SourceDataService.value;
	const props = CatalogPropsService.value;
	return useMemo(() => {
		const source = sourceName || props?.sourceName;
		if (!source) return null;
		return sourceDatas.find((data) => getStorageNameByData(data) === source);
	}, [sourceDatas, sourceName, props]);
};

export const useIsStorageConnected = (): boolean => {
	const storage = useStorage();
	return !!storage;
};

export const useIsRepoOk = (catalogProps?: ClientCatalogProps, checkInvalid = true): boolean => {
	const props = catalogProps || CatalogPropsService.value;
	const storage = useStorage();
	if (!checkInvalid) return !props?.repositoryError;
	return !!storage && !storage.isInvalid && !props?.repositoryError;
};

export default useStorage;
