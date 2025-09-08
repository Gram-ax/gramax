import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { useMemo } from "react";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import getStorageNameByData from "./getStorageNameByData";

const useStorage = (): SourceData | null => {
	const sourceDatas = SourceDataService.value;
	const catalogProps = CatalogPropsService.value;
	return useMemo(() => {
		if (!catalogProps) return null;
		return sourceDatas.find((data) => getStorageNameByData(data) === catalogProps.sourceName);
	}, [sourceDatas, catalogProps]);
};

export default useStorage;
