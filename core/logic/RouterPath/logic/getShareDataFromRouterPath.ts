import type PathnameData from "@core/RouterPath/model/PathnameData";
import type ShareData from "@ext/catalog/actions/share/model/ShareData";
import type GitShareData from "@ext/git/core/model/GitShareData";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const getShareDataFromPathnameData = (pathnameData: PathnameData, sourceType: SourceType): ShareData => {
	let shareData: ShareData = {
		filePath: pathnameData.filePath,
		name: pathnameData.repo,
		sourceType,
		isPublic: pathnameData.isPublic,
	};
	if (isGitSourceType(sourceType)) {
		const { sourceName: domain, group, refname: branch } = pathnameData;
		(shareData as GitShareData) = { ...shareData, domain, group, branch, sourceType: sourceType as SourceType.git };
	}
	return shareData;
};

export default getShareDataFromPathnameData;
