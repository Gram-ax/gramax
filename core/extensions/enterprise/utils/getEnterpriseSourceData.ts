import GitLabSourceData from "@ext/git/core/model/GitLabSourceData.schema";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

export const getEnterpriseSourceData = (sourceDatas: SourceData[], gesUrl: string) => {
	return sourceDatas.find((data) => {
		return gesUrl?.includes((data as GitLabSourceData)?.domain);
	}) as GitLabSourceData;
};
