import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import type GitShareData from "../../../../git/core/model/GitShareData";
import type GitSourceData from "../../../../git/core/model/GitSourceData.schema";
import type GitStorageData from "../../../../git/core/model/GitStorageData";
import type SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import type StorageData from "../../../../storage/models/StorageData";
import type ShareData from "../model/ShareData";

const convertShareLinkDataToStorageData = (sourceData: SourceData, shareLinkData: ShareData): StorageData => {
	if (!sourceData || !shareLinkData) return null;

	if (isGitSourceType(shareLinkData.sourceType)) {
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
