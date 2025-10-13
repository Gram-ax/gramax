import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { useMemo } from "react";

const ALLOWED_SOURCE_TYPES = [SourceType.confluenceCloud];
const ALLOWED_TAURI_SOURCE_TYPES = [...ALLOWED_SOURCE_TYPES, SourceType.notion, SourceType.confluenceServer];

export const getAllowedSourceTypes = (isTauri: boolean) => {
	const types = isTauri ? ALLOWED_TAURI_SOURCE_TYPES : ALLOWED_SOURCE_TYPES;
	return types.reduce((acc, type) => {
		acc[type] = type;
		return acc;
	}, {} as Record<SourceType, SourceType>);
};

export const getAllSourceTypes = () => {
	return ALLOWED_TAURI_SOURCE_TYPES;
};

export const useFilteredSourceData = () => {
	const sourceDatas = SourceDataService.value;
	const { isTauri } = usePlatform();

	return useMemo(
		() =>
			sourceDatas.filter((sourceData) =>
				isTauri
					? ALLOWED_TAURI_SOURCE_TYPES.includes(sourceData.sourceType)
					: ALLOWED_SOURCE_TYPES.includes(sourceData.sourceType),
			),
		[sourceDatas, isTauri],
	);
};
