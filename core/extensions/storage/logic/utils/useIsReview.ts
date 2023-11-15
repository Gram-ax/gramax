import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import SourceType from "../SourceDataProvider/model/SourceType";
import getPartSourceDataByStorageName from "./getPartSourceDataByStorageName";

const useIsReview = (): boolean => {
	const sourceName = CatalogPropsService.value.sourceName;
	const { sourceType } = getPartSourceDataByStorageName(sourceName);
	return sourceType === SourceType.enterprise;
};

export default useIsReview;
