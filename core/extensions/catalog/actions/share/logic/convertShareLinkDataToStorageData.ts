import GitShareData from "../../../../git/core/model/GitShareData";
import GitSourceData from "../../../../git/core/model/GitSourceData.schema";
import GitStorageData from "../../../../git/core/model/GitStorageData";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";
import StorageData from "../../../../storage/models/StorageData";
import ShareData from "../model/ShareData";

const convertShareLinkDataToStorageData = (sourceData: SourceData, shareLinkData: ShareData): StorageData => {
	if (shareLinkData.sourceType === SourceType.gitLab || shareLinkData.sourceType === SourceType.gitHub) {
		return {
			source: sourceData as GitSourceData,
			group: (shareLinkData as GitShareData).group,
			name: shareLinkData.name,
		} as GitStorageData;
	}
	return {
		name: shareLinkData.name,
		source: sourceData,
	};
};

export default convertShareLinkDataToStorageData;
