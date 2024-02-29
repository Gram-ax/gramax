import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import SourceType from "../SourceDataProvider/model/SourceType";
import getPartGitSourceDataByStorageName from "./getPartSourceDataByStorageName";

const useIsReview = (): boolean => {
	const catalogProps = CatalogPropsService.value;
	if (!catalogProps) return false;
	const sourceName = catalogProps.sourceName;
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);
	return sourceType === SourceType.enterprise;
};

export default useIsReview;
