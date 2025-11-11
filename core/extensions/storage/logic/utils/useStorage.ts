import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { useMemo } from "react";
import getStorageNameByData from "./getStorageNameByData";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const useStorage = (sourceName?: string): SourceData | null => {
	const sourceDatas = SourceDataService.value;
	const catalogSourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	return useMemo(() => {
		const source = sourceName || catalogSourceName;
		if (!source) return null;
		return sourceDatas.find((data) => getStorageNameByData(data) === source);
	}, [sourceDatas, sourceName, catalogSourceName]);
};

export const useIsStorageConnected = (): boolean => {
	const storage = useStorage();
	return !!storage;
};

export const useIsRepoOk = (catalogProps?: ClientCatalogProps, checkInvalid = true): boolean => {
	const repositoryError = useCatalogPropsStore((state) => state.data?.repositoryError);
	const props = catalogProps || { repositoryError };
	const storage = useStorage();
	if (!checkInvalid) return !props?.repositoryError;
	return !!storage && !storage.isInvalid && !props?.repositoryError;
};

export default useStorage;
