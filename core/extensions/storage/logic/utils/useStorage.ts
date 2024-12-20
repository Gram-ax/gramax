import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { useMemo } from "react";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import PageDataContextService from "../../../../ui-logic/ContextServices/PageDataContext";
import getStorageNameByData from "./getStorageNameByData";

const useStorage = (): SourceData | null => {
	const pageProps = PageDataContextService.value;
	const catalogProps = CatalogPropsService.value;
	return useMemo(() => {
		if (!catalogProps) return null;
		return pageProps.sourceDatas.find((data) => getStorageNameByData(data) === catalogProps.sourceName);
	}, [pageProps, catalogProps]);
};

export default useStorage;
