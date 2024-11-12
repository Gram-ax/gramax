import PathnameData from "@core/RouterPath/model/PathnameData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import GitShareData from "@ext/git/core/model/GitShareData";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const getShareDataFromPathnameData = (pathnameData: PathnameData, sourceType: SourceType): ShareData => {
	let shareData: ShareData = {
		filePath: pathnameData.filePath.join("/"),
		name: pathnameData.repo,
		sourceType,
	};
	if (isGitSourceType(sourceType)) {
		const { sourceName: domain, group, refname: branch } = pathnameData;
		(shareData as GitShareData) = { ...shareData, domain, group, branch, sourceType: sourceType as SourceType.git };
	}
	return shareData;
};

export default getShareDataFromPathnameData;
